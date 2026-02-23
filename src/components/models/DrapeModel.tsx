import { useRef, useMemo, useState, useEffect } from 'react';
import { Mesh, PlaneGeometry, Vector3 } from 'three';
import { Text } from '@react-three/drei';
import type { DrapeStyle, Dimensions } from '../../types';

interface DrapeModelProps {
  style: DrapeStyle;
  color: string;
  dimensions: Dimensions;
  opacity: number;
  texture?: 'smooth' | 'fabric' | 'woven';
  showMeasurements: boolean;
  openAmount: number;
  panelCount?: number;
}

export default function DrapeModel({
  style,
  color,
  dimensions,
  opacity,
  showMeasurements,
  openAmount,
  panelCount = 2,
}: DrapeModelProps) {

  const drapeRefs = useRef<(Mesh | null)[]>([]);

  // ensure array size
  if (drapeRefs.current.length !== panelCount) {
    drapeRefs.current = Array(panelCount).fill(null);
  }

  // Smoothing logic
  const [smoothAmount, setSmoothAmount] = useState(openAmount);
  useEffect(() => {
    let frameId: number;
    const animate = () => {
      setSmoothAmount(prev => {
        const diff = openAmount - prev;
        if (Math.abs(diff) < 0.001) return openAmount;
        const next = prev + diff * 0.15;
        frameId = requestAnimationFrame(animate);
        return next;
      });
    };
    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [openAmount]);

  const displayAmount = smoothAmount;

  const scale = useMemo(() => {
    const baseWidth = 3.8; // Match window glass width
    const baseHeight = 2.8; // Match window glass height
    return {
      width: (dimensions.width / 150) * baseWidth,
      height: (dimensions.height / 200) * baseHeight,
    };
  }, [dimensions]);

  const drapeGeometry = useMemo(() => {
    const widthSegments = 70;
    const heightSegments = 90;
    const geometry = new PlaneGeometry(1, 1, widthSegments, heightSegments);
    const pos = geometry.getAttribute('position');
    const v = new Vector3();

    let foldCount = 8;
    let foldDepth = 0.1;
    let puddleAmount = 0.05;

    if (style === 'luxury') {
      foldCount = 6;
      foldDepth = 0.15;
      puddleAmount = 0.1;
    } else if (style === 'minimal') {
      foldCount = 12;
      foldDepth = 0.04;
      puddleAmount = 0;
    } else if (style === 'modern') {
      foldCount = 9;
      foldDepth = 0.08;
      puddleAmount = 0.02;
    } else if (style === 'classic') {
      foldCount = 8;
      foldDepth = 0.12;
      puddleAmount = 0.06;
    }

    const gatherIntensity = 1.3 - displayAmount * 0.5;

    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);

      const x = v.x + 0.5;
      const y = v.y + 0.5;

      // Vertical folds
      const foldPhase = x * Math.PI * foldCount;
      const foldWave = Math.sin(foldPhase);

      // Top is held by rod
      const topConstraint = y > 0.92 ? Math.pow((1 - y) * 12, 2) : 1;

      // Euro Pleat (Triple Pinch) effect at the top
      const pleatWave = Math.pow(Math.abs(Math.sin(foldPhase * 1.5)), 0.5) * 0.35;
      const topEmphasis = (1 - topConstraint) * pleatWave;

      // Bottom drapes naturally
      const bottomWeight = Math.pow(1 - y, 0.7);

      const depth = (foldWave + topEmphasis) * foldDepth * gatherIntensity * topConstraint * (0.4 + bottomWeight * 0.6);

      // Floor puddle
      let puddleZ = 0;
      if (y < 0.05 && puddleAmount > 0) {
        const puddlePhase = (0.05 - y) * 20;
        puddleZ = Math.sin(puddlePhase * Math.PI * 0.5) * puddleAmount;
      }

      pos.setZ(i, depth + puddleZ);
    }

    geometry.computeVertexNormals();
    return geometry;
  }, [style, displayAmount]);

  // Material properties based on fabric type
  const getMaterialProps = () => {
    const base = {
      color,
      side: 2 as const,
      transparent: true,
      opacity: opacity
    };

    if (style === 'luxury') {
      return {
        ...base,
        roughness: 0.55,
        sheen: 1.0,
        sheenColor: '#ffffff',
        sheenRoughness: 0.25,
        clearcoat: 0.15,
        clearcoatRoughness: 0.3
      };
    } else if (style === 'modern' || style === 'minimal') {
      return {
        ...base,
        roughness: 0.85,
        metalness: 0,
        sheen: 0.35,
        sheenRoughness: 0.8,
        clearcoat: 0.02
      }
    } else {
      return {
        ...base,
        roughness: 0.75,
        sheen: 0.6,
        sheenRoughness: 0.45,
        clearcoat: 0.05
      }
    }
  };

  const fullPanelWidth = scale.width / panelCount;
  const minWidthRatio = style === 'luxury' ? 0.3 : style === 'minimal' ? 0.18 : 0.22;
  const currentWidth = fullPanelWidth * (minWidthRatio + (1 - minWidthRatio) * displayAmount);

  const dropOffset = dimensions.drop / 100;
  const totalHeight = scale.height + dropOffset;
  const drapeY = -dropOffset / 2;

  const leftCount = Math.ceil(panelCount / 2);

  const panelsData = Array.from({ length: panelCount }).map((_, i) => {
    const isLeft = i < leftCount;
    let xPos = 0;
    const staggerZ = i * 0.005; // Stagger to distinguish overlapping panels
    const panelGap = 0.003;

    if (isLeft) {
      xPos = -scale.width / 2 + (i + 0.5) * currentWidth + (i * panelGap);
    } else {
      const j = panelCount - 1 - i;
      xPos = scale.width / 2 - (j + 0.5) * currentWidth - (j * panelGap);
    }
    return { id: i, x: xPos, z: staggerZ, isLeft };
  });

  return (
    <group position={[0, 0.4, -2.75]}>
      {/* Decorative Rod */}
      <mesh position={[0, scale.height / 2 + 0.12, 0.05]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.025, 0.025, scale.width + 0.5, 32]} />
        {style === 'luxury' || style === 'classic' ? (
          <meshStandardMaterial color="#c9a961" metalness={0.9} roughness={0.2} />
        ) : (
          <meshStandardMaterial color="#404040" metalness={0.7} roughness={0.3} />
        )}
      </mesh>

      {/* Finials */}
      {[-1, 1].map((side) => (
        <mesh
          key={side}
          position={[side * (scale.width + 0.5) / 2, scale.height / 2 + 0.12, 0.05]}
          castShadow
        >
          {style === 'minimal' || style === 'modern' ? (
            <boxGeometry args={[0.05, 0.05, 0.05]} />
          ) : (
            <sphereGeometry args={[0.05, 16, 16]} />
          )}
          {style === 'luxury' || style === 'classic' ? (
            <meshStandardMaterial color="#c9a961" metalness={0.9} roughness={0.2} />
          ) : (
            <meshStandardMaterial color="#404040" metalness={0.7} roughness={0.3} />
          )}
        </mesh>
      ))}

      {/* Drapery Panels */}
      {panelsData.map((panel, i) => (
        <mesh
          key={panel.id}
          ref={(el) => { if (el) drapeRefs.current[i] = el; }}
          position={[panel.x, drapeY, 0.05 + panel.z]}
          scale={[currentWidth, totalHeight, 1]}
          geometry={drapeGeometry}
          castShadow
          receiveShadow
        >
          <meshPhysicalMaterial {...getMaterialProps()} />
        </mesh>
      ))}

      {showMeasurements && (
        <Text
          position={[0, scale.height / 2 + 0.35, 0]}
          fontSize={0.12}
          color="#ffffff"
          outlineWidth={0.01}
          outlineColor="#000000"
          anchorX="center"
          anchorY="middle"
        >
          {Math.round(dimensions.width)} cm x {Math.round(dimensions.height)} cm
        </Text>
      )}
    </group>
  );
}
