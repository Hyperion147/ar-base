import { useMemo } from 'react';
import { PlaneGeometry, Vector3 } from 'three';
import { Text } from '@react-three/drei';

type CurtainStyle = 'sheer' | 'blackout' | 'velvet' | 'linen';
type TextureType = 'smooth' | 'fabric' | 'woven';

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
  texture?: TextureType;
  showMeasurements: boolean;
  openAmount: number;
  panelCount?: number;
}

export default function CurtainModel({
  style,
  color,
  dimensions,
  opacity,
  texture = 'fabric',
  showMeasurements,
  openAmount,
  panelCount = 2,
}: CurtainModelProps) {
  const scale = useMemo(() => {
    const baseWidth = 3.8;
    const baseHeight = 2.8;
    return {
      width: (dimensions.width / 150) * baseWidth,
      height: (dimensions.height / 200) * baseHeight,
    };
  }, [dimensions]);

  const curtainGeometry = useMemo(() => {
    let foldCount = 8;
    let foldDepth = 0.1;
    let fabricWeight = 1.0;

    if (style === 'sheer') {
      foldCount = 12;
      foldDepth = 0.06;
      fabricWeight = 0.3;
    } else if (style === 'velvet') {
      foldCount = 6;
      foldDepth = 0.16;
      fabricWeight = 1.55;
    } else if (style === 'blackout') {
      foldCount = 7;
      foldDepth = 0.11;
      fabricWeight = 1.25;
    } else if (style === 'linen') {
      foldCount = 10;
      foldDepth = 0.095;
      fabricWeight = 0.82;
    }

    const geometry = new PlaneGeometry(1, 1, 100, 120);
    const pos = geometry.getAttribute('position');
    const vertex = new Vector3();
    const gatherIntensity = 1.62 - openAmount * 0.84;

    for (let i = 0; i < pos.count; i++) {
      vertex.fromBufferAttribute(pos, i);

      const x = vertex.x + 0.5;
      const y = vertex.y + 0.5;
      const foldPhase = x * Math.PI * foldCount;
      const foldWave = Math.sin(foldPhase);
      const secondaryWave = Math.sin(foldPhase * 2.25) * 0.22;
      const topConstraint = y > 0.9 ? Math.pow((1 - y) * 10, 2) : 1;
      const pleatWave = Math.abs(Math.sin(foldPhase * 1.5)) * (style === 'velvet' || style === 'linen' ? 0.38 : 0.18);
      const bottomWeight = Math.pow(1 - y, 0.8) * fabricWeight;
      const edgeWrap = Math.sin(y * Math.PI) * 0.015;

      const depth =
        (foldWave + secondaryWave + pleatWave * (1 - topConstraint)) *
          foldDepth *
          gatherIntensity *
          topConstraint *
          (0.3 + bottomWeight * 0.7) +
        edgeWrap;

      pos.setZ(i, depth);
    }

    geometry.computeVertexNormals();
    return geometry;
  }, [style, openAmount]);

  const materialProps = useMemo(() => {
    const textureBoost = {
      smooth: { roughness: -0.16, sheen: 0.08 },
      fabric: { roughness: 0, sheen: 0.16 },
      woven: { roughness: 0.08, sheen: 0.28 },
    }[texture];

    const baseProps = {
      color,
      transparent: true,
      side: (style === 'sheer' ? 0 : 2) as 0 | 1 | 2,
    };

    switch (style) {
      case 'sheer':
        return {
          ...baseProps,
          opacity: Math.min(opacity * 0.7, 0.78),
          roughness: 0.28 + textureBoost.roughness,
          transmission: 0.92,
          thickness: 0.03,
          ior: 1.18,
          sheen: 0.22 + textureBoost.sheen,
          sheenColor: '#ffffff',
          sheenRoughness: 0.52,
          envMapIntensity: 1.15,
          depthWrite: false,
        };
      case 'blackout':
        return {
          ...baseProps,
          opacity: 1,
          roughness: 0.9 + textureBoost.roughness,
          metalness: 0,
          sheen: 0.18 + textureBoost.sheen,
          clearcoat: 0.04,
          clearcoatRoughness: 0.9,
          envMapIntensity: 0.15,
        };
      case 'velvet':
        return {
          ...baseProps,
          opacity: 1,
          roughness: 0.82 + textureBoost.roughness,
          sheen: 0.95 + textureBoost.sheen,
          sheenColor: color,
          sheenRoughness: 0.18,
          clearcoat: 0.08,
          clearcoatRoughness: 0.42,
          envMapIntensity: 0.78,
        };
      case 'linen':
      default:
        return {
          ...baseProps,
          opacity: Math.min(opacity, 0.98),
          roughness: 0.88 + textureBoost.roughness,
          metalness: 0,
          sheen: 0.34 + textureBoost.sheen,
          sheenRoughness: 0.78,
          envMapIntensity: 0.4,
        };
    }
  }, [color, opacity, style, texture]);

  const fullPanelWidth = scale.width / panelCount;
  let minWidthRatio = 0.18;
  if (style === 'sheer') minWidthRatio = 0.12;
  else if (style === 'velvet') minWidthRatio = 0.28;
  else if (style === 'blackout') minWidthRatio = 0.22;
  else if (style === 'linen') minWidthRatio = 0.16;

  const currentWidth = fullPanelWidth * (minWidthRatio + (1 - minWidthRatio) * openAmount);
  const dropOffset = dimensions.drop / 100;
  const totalHeight = scale.height + dropOffset;
  const curtainY = -dropOffset / 2;
  const leftCount = Math.ceil(panelCount / 2);

  const panelsData = Array.from({ length: panelCount }).map((_, i) => {
    const isLeft = i < leftCount;
    const staggerZ = i * 0.006;
    const panelGap = 0.003;
    const x = isLeft
      ? -scale.width / 2 + (i + 0.5) * currentWidth + i * panelGap
      : scale.width / 2 - (panelCount - i - 0.5) * currentWidth - (panelCount - 1 - i) * panelGap;
    return { id: i, x, z: staggerZ, isLeft };
  });

  return (
    <group position={[0, 0.5, -2.65]}>
      <mesh position={[0, scale.height / 2 + 0.03, -0.045]} castShadow>
        <boxGeometry args={[scale.width + 0.22, 0.18, 0.09]} />
        <meshStandardMaterial color="#ece3d7" roughness={0.7} metalness={0.04} />
      </mesh>

      <mesh position={[0, scale.height / 2 + 0.08, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.018, 0.018, scale.width + 0.4, 32]} />
        <meshStandardMaterial color="#c8c8c8" metalness={0.75} roughness={0.2} />
      </mesh>

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

      {Array.from({ length: Math.floor(scale.width * 6) }).map((_, i) => {
        const ringSpacing = scale.width / Math.floor(scale.width * 6);
        const xPos = -scale.width / 2 + i * ringSpacing + ringSpacing / 2;
        return (
          <mesh key={i} position={[xPos, scale.height / 2 + 0.1, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.01, 0.003, 8, 12]} />
            <meshStandardMaterial color="#d0d0d0" metalness={0.85} roughness={0.15} />
          </mesh>
        );
      })}

      {panelsData.map((panel) => (
        <group key={panel.id} position={[panel.x, curtainY, panel.z]}>
          <mesh position={[0, 0, -0.025]} scale={[currentWidth * 1.015, totalHeight * 0.992, 1]} geometry={curtainGeometry} castShadow receiveShadow>
            <meshPhysicalMaterial color="#f4efe8" roughness={0.95} opacity={0.22} transparent side={2} />
          </mesh>
          <mesh position={[0, 0, 0]} scale={[currentWidth, totalHeight, 1]} geometry={curtainGeometry} castShadow receiveShadow>
            <meshPhysicalMaterial {...materialProps} />
          </mesh>
          <mesh position={[0, totalHeight / 2 - 0.04, 0.02]} castShadow>
            <boxGeometry args={[currentWidth * 0.88, 0.05, 0.022]} />
            <meshStandardMaterial color="#f7f1ea" roughness={0.72} />
          </mesh>
          {openAmount < 0.58 && (
            <group position={[panel.isLeft ? currentWidth * 0.2 : -currentWidth * 0.2, -totalHeight * 0.06, 0.055]}>
              <mesh castShadow>
                <torusGeometry args={[0.08, 0.008, 10, 30, Math.PI]} />
                <meshStandardMaterial color="#b79d84" metalness={0.55} roughness={0.42} />
              </mesh>
              <mesh position={[0, 0, -0.02]}>
                <boxGeometry args={[0.12, 0.022, 0.012]} />
                <meshStandardMaterial color="#d8ccb8" roughness={0.8} />
              </mesh>
            </group>
          )}
        </group>
      ))}

      <mesh position={[0, -scale.height / 2 - dropOffset + 0.02, -0.08]} receiveShadow>
        <boxGeometry args={[scale.width + 0.18, 0.03, 0.12]} />
        <meshStandardMaterial color="#cab8a6" roughness={0.82} />
      </mesh>

      {showMeasurements && (
        <>
          <Text position={[0, scale.height / 2 + 0.3, 0]} fontSize={0.12} color="#ffffff" outlineWidth={0.012} outlineColor="#000000" anchorX="center" anchorY="middle">
            {Math.round(dimensions.width)} cm
          </Text>
          <Text position={[scale.width / 2 + 0.3, 0, 0]} fontSize={0.12} color="#ffffff" outlineWidth={0.012} outlineColor="#000000" anchorX="center" anchorY="middle" rotation={[0, 0, -Math.PI / 2]}>
            {Math.round(dimensions.height)} cm
          </Text>
        </>
      )}
    </group>
  );
}
