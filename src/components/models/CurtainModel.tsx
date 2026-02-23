import { useRef, useMemo } from 'react';
import { Mesh, PlaneGeometry, Vector3 } from 'three';
import { Text } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';

type CurtainStyle = 'sheer' | 'blackout' | 'velvet' | 'linen';

interface Dimensions {
  width: number;
  height: number;
  drop: number;
}

interface CurtainModelProps {
  style: CurtainStyle;
  color: string;
  dimensions: Dimensions;
  opacity: number;
  texture?: 'smooth' | 'fabric' | 'woven';
  showMeasurements: boolean;
  openAmount: number;
  panelCount?: number;
}

export default function CurtainModel({
  style,
  color,
  dimensions,
  opacity,
  showMeasurements,
  openAmount,
  panelCount = 2,
}: CurtainModelProps) {

  const curtainRefs = useRef<(Mesh | null)[]>([]);

  // ensure array size
  if (curtainRefs.current.length !== panelCount) {
    curtainRefs.current = Array(panelCount).fill(null);
  }

  const scale = useMemo(() => {
    const baseWidth = 3.8; // Match window glass width
    const baseHeight = 2.8; // Match window glass height
    return {
      width: (dimensions.width / 150) * baseWidth,
      height: (dimensions.height / 200) * baseHeight,
    };
  }, [dimensions]);

  // Create realistic curtain with natural folds
  const curtainGeometry = useMemo(() => {
    // Style-specific parameters
    let foldCount = 8;
    let foldDepth = 0.1;
    let fabricWeight = 1.0;

    if (style === 'sheer') {
      foldCount = 12;
      foldDepth = 0.06;
      fabricWeight = 0.3;
    } else if (style === 'velvet') {
      foldCount = 6;
      foldDepth = 0.14;
      fabricWeight = 1.5;
    } else if (style === 'blackout') {
      foldCount = 7;
      foldDepth = 0.1;
      fabricWeight = 1.2;
    } else if (style === 'linen') {
      foldCount = 9;
      foldDepth = 0.09;
      fabricWeight = 0.8;
    }

    const widthSegments = 80;
    const heightSegments = 100;
    const geometry = new PlaneGeometry(1, 1, widthSegments, heightSegments);
    const pos = geometry.getAttribute('position');
    const v = new Vector3();

    const gatherIntensity = 1.6 - openAmount * 0.8;

    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);

      const x = v.x + 0.5;
      const y = v.y + 0.5;

      // Vertical folds
      const foldPhase = x * Math.PI * foldCount;
      const foldWave = Math.sin(foldPhase);
      const secondaryWave = Math.sin(foldPhase * 2.1) * 0.25;

      // Top is held by rod
      const topConstraint = y > 0.90 ? Math.pow((1 - y) * 10, 2) : 1;

      // Custom pleating for different styles
      let pleatEffect = 0;
      if (style === 'velvet' || style === 'linen') {
        // Double/Triple Pinch Pleat effect near the top
        const pleatWave = Math.abs(Math.sin(foldPhase * 1.5)) * 0.4;
        pleatEffect = pleatWave * (1 - topConstraint);
      }

      // Bottom drapes naturally
      const bottomWeight = Math.pow(1 - y, 0.8) * fabricWeight;

      const depth = (foldWave + secondaryWave + pleatEffect) * foldDepth * gatherIntensity * topConstraint * (0.3 + bottomWeight * 0.7);

      pos.setZ(i, depth);
    }

    geometry.computeVertexNormals();
    return geometry;
  }, [style, openAmount]);

  // Animate gentle breeze removed per request.

  const animatedOpenAmount = useRef(openAmount);
  const swayRotation = useRef(0);
  const lastOpenAmount = useRef(openAmount);

  // Material properties based on fabric type
  const materialProps = useMemo(() => {
    const baseProps = {
      color,
      transparent: true,
      // Avoid double-sided rendering for sheer objects to prevent huge Z-fighting triangles on overlap
      side: (style === 'sheer' ? 0 : 2) as 0 | 1 | 2,
    };

    switch (style) {
      case 'sheer':
        return {
          ...baseProps,
          opacity: Math.min(opacity * 0.7, 0.8),
          roughness: 0.25,
          transmission: 0.9,
          thickness: 0.02,
          ior: 1.2,
          sheen: 0.3,
          sheenColor: '#ffffff',
          sheenRoughness: 0.5,
          envMapIntensity: 1.2,
          depthWrite: false,
        };
      case 'blackout':
        return {
          ...baseProps,
          opacity: 1,
          roughness: 0.92,
          metalness: 0,
          sheen: 0.2,
          clearcoat: 0.05,
          clearcoatRoughness: 0.9,
          envMapIntensity: 0.15,
        };
      case 'velvet':
        return {
          ...baseProps,
          opacity: 1,
          roughness: 0.85,
          sheen: 1.0,
          sheenColor: color,
          sheenRoughness: 0.2,
          clearcoat: 0.1,
          clearcoatRoughness: 0.4,
          envMapIntensity: 0.8,
        };
      case 'linen':
      default:
        return {
          ...baseProps,
          opacity: Math.min(opacity, 0.98),
          roughness: 0.9,
          metalness: 0,
          sheen: 0.4,
          sheenRoughness: 0.8,
          envMapIntensity: 0.4,
        };
    }
  }, [style, color, opacity]);

  // Different fabrics gather differently
  const minWidthRatio = useMemo(() => {
    if (style === 'sheer') return 0.12;
    if (style === 'velvet') return 0.28;
    if (style === 'blackout') return 0.22;
    return 0.16; // linen
  }, [style]);

  useFrame((_, delta) => {
    // Smoothing: Lerp towards target openAmount
    const lerpFactor = 1 - Math.pow(0.001, delta); // Resolution independent smoothing
    animatedOpenAmount.current += (openAmount - animatedOpenAmount.current) * Math.min(lerpFactor * 5, 0.2);

    // Realistic Sway Effect
    const velocity = (animatedOpenAmount.current - lastOpenAmount.current) / delta;
    lastOpenAmount.current = animatedOpenAmount.current;

    const targetSway = -velocity * 0.05; // Amount of sway based on speed
    swayRotation.current += (targetSway - swayRotation.current) * Math.min(lerpFactor * 3, 0.1);

    // Apply sway to panels
    curtainRefs.current.forEach((panel, i) => {
      if (!panel) return;

      // Panels at the edge sway slightly more than center ones for realism
      const isLeft = i < Math.ceil(panelCount / 2);
      const swayForce = swayRotation.current * (isLeft ? 1 : -1);
      panel.rotation.y = swayForce;

      // Update panel width and position
      const fullPanelWidth = scale.width / panelCount;
      const currentWidth = fullPanelWidth * (minWidthRatio + (1 - minWidthRatio) * animatedOpenAmount.current);
      const panelGap = 0.002;

      let xPos = 0;
      if (isLeft) {
        xPos = -scale.width / 2 + (i + 0.5) * currentWidth + (i * panelGap);
      } else {
        const j = panelCount - 1 - i;
        xPos = scale.width / 2 - (j + 0.5) * currentWidth - (j * panelGap);
      }

      panel.position.x = xPos;
      panel.scale.setX(currentWidth);

      // Dynamic Fold Depth based on openness
      // We update the geometry only when it actually changes much to save perf
      // but for now let's use the memoized geometry which depends on prop openAmount.
      // To make it truly smooth, we should update vertex positions based on animatedOpenAmount.
      // However, updating 8k vertices per frame might be too much.
      // Let's use a simpler approach: vary the mesh scale slightly for "billow"
      panel.scale.z = 1 + Math.abs(swayRotation.current) * 0.5;
    });
  });

  const dropOffset = dimensions.drop / 100;
  const totalHeight = scale.height + dropOffset;
  const curtainY = -dropOffset / 2;

  return (
    <group position={[0, 0.5, -2.65]}>
      {/* Curtain Rod */}
      <mesh position={[0, scale.height / 2 + 0.08, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.018, 0.018, scale.width + 0.4, 32]} />
        <meshStandardMaterial color="#c8c8c8" metalness={0.75} roughness={0.2} />
      </mesh>

      {/* Rod End Caps */}
      {[-1, 1].map((side) => (
        <group key={side} position={[side * (scale.width + 0.4) / 2, scale.height / 2 + 0.08, 0]}>
          <mesh position={[0, 0, -0.03]} castShadow>
            <boxGeometry args={[0.04, 0.05, 0.04]} />
            <meshStandardMaterial color="#a8a8a8" metalness={0.6} roughness={0.3} />
          </mesh>
          <mesh position={[side * 0.03, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.022, 0.018, 0.05, 16]} />
            <meshStandardMaterial color="#b8b8b8" metalness={0.7} roughness={0.25} />
          </mesh>
        </group>
      ))}

      {/* Curtain Panels */}
      {Array.from({ length: panelCount }).map((_, i) => (
        <mesh
          key={i}
          ref={(el) => { if (el) curtainRefs.current[i] = el; }}
          position={[0, curtainY, 0]}
          scale={[1, totalHeight, 1]}
          geometry={curtainGeometry}
          castShadow
          receiveShadow
        >
          <meshPhysicalMaterial {...materialProps} />
        </mesh>
      ))}

      {/* Measurements */}
      {showMeasurements && (
        <>
          <Text
            position={[0, scale.height / 2 + 0.3, 0]}
            fontSize={0.12}
            color="#ffffff"
            outlineWidth={0.012}
            outlineColor="#000000"
            anchorX="center"
            anchorY="middle"
          >
            {Math.round(dimensions.width)} cm
          </Text>
          <Text
            position={[scale.width / 2 + 0.3, 0, 0]}
            fontSize={0.12}
            color="#ffffff"
            outlineWidth={0.012}
            outlineColor="#000000"
            anchorX="center"
            anchorY="middle"
            rotation={[0, 0, -Math.PI / 2]}
          >
            {Math.round(dimensions.height)} cm
          </Text>
        </>
      )}
    </group>
  );
}
