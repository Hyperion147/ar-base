import { useMemo } from 'react';
import { PlaneGeometry, Vector3 } from 'three';
import { Text } from '@react-three/drei';
import type { DrapeStyle, Dimensions } from '../../types';

type TextureType = 'smooth' | 'fabric' | 'woven';

interface DrapeModelProps {
  style: DrapeStyle;
  color: string;
  dimensions: Dimensions;
  opacity: number;
  texture?: TextureType;
  showMeasurements: boolean;
  openAmount: number;
  panelCount?: number;
}

export default function DrapeModel({
  style,
  color,
  dimensions,
  opacity,
  texture = 'fabric',
  showMeasurements,
  openAmount,
  panelCount = 2,
}: DrapeModelProps) {
  const scale = useMemo(() => {
    const baseWidth = 3.8;
    const baseHeight = 2.8;
    return {
      width: (dimensions.width / 150) * baseWidth,
      height: (dimensions.height / 200) * baseHeight,
    };
  }, [dimensions]);

  const drapeGeometry = useMemo(() => {
    const geometry = new PlaneGeometry(1, 1, 80, 110);
    const pos = geometry.getAttribute('position');
    const vertex = new Vector3();

    let foldCount = 8;
    let foldDepth = 0.1;
    let puddleAmount = 0.05;

    if (style === 'luxury') {
      foldCount = 6;
      foldDepth = 0.16;
      puddleAmount = 0.11;
    } else if (style === 'minimal') {
      foldCount = 12;
      foldDepth = 0.045;
      puddleAmount = 0;
    } else if (style === 'modern') {
      foldCount = 9;
      foldDepth = 0.085;
      puddleAmount = 0.02;
    }

    const gatherIntensity = 1.32 - openAmount * 0.5;

    for (let i = 0; i < pos.count; i++) {
      vertex.fromBufferAttribute(pos, i);
      const x = vertex.x + 0.5;
      const y = vertex.y + 0.5;
      const foldPhase = x * Math.PI * foldCount;
      const foldWave = Math.sin(foldPhase);
      const topConstraint = y > 0.92 ? Math.pow((1 - y) * 12, 2) : 1;
      const pleatWave = Math.pow(Math.abs(Math.sin(foldPhase * 1.5)), 0.5) * 0.35;
      const bottomWeight = Math.pow(1 - y, 0.7);
      const puddleZ = y < 0.05 && puddleAmount > 0 ? Math.sin((0.05 - y) * 20 * Math.PI * 0.5) * puddleAmount : 0;

      const depth =
        (foldWave + pleatWave * (1 - topConstraint)) *
          foldDepth *
          gatherIntensity *
          topConstraint *
          (0.4 + bottomWeight * 0.6) +
        puddleZ;

      pos.setZ(i, depth);
    }

    geometry.computeVertexNormals();
    return geometry;
  }, [openAmount, style]);

  const materialProps = useMemo(() => {
    const textureBoost = {
      smooth: { roughness: -0.18, sheen: 0.08 },
      fabric: { roughness: 0, sheen: 0.14 },
      woven: { roughness: 0.08, sheen: 0.24 },
    }[texture];

    const base = {
      color,
      side: 2 as const,
      transparent: true,
      opacity,
    };

    if (style === 'luxury') {
      return {
        ...base,
        roughness: 0.55 + textureBoost.roughness,
        sheen: 1.0 + textureBoost.sheen,
        sheenColor: '#ffffff',
        sheenRoughness: 0.25,
        clearcoat: 0.15,
        clearcoatRoughness: 0.3,
      };
    }

    if (style === 'modern' || style === 'minimal') {
      return {
        ...base,
        roughness: 0.85 + textureBoost.roughness,
        metalness: 0,
        sheen: 0.35 + textureBoost.sheen,
        sheenRoughness: 0.8,
        clearcoat: 0.02,
      };
    }

    return {
      ...base,
      roughness: 0.75 + textureBoost.roughness,
      sheen: 0.6 + textureBoost.sheen,
      sheenRoughness: 0.45,
      clearcoat: 0.05,
    };
  }, [color, opacity, style, texture]);

  const fullPanelWidth = scale.width / panelCount;
  const minWidthRatio = style === 'luxury' ? 0.3 : style === 'minimal' ? 0.18 : 0.22;
  const currentWidth = fullPanelWidth * (minWidthRatio + (1 - minWidthRatio) * openAmount);
  const dropOffset = dimensions.drop / 100;
  const totalHeight = scale.height + dropOffset;
  const drapeY = -dropOffset / 2;
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

  const hardwareColor = style === 'luxury' || style === 'classic' ? '#c9a961' : '#404040';

  return (
    <group position={[0, 0.4, -2.75]}>
      <mesh position={[0, scale.height / 2 + 0.05, 0.01]} castShadow>
        <boxGeometry args={[scale.width + 0.32, 0.16, 0.12]} />
        <meshStandardMaterial color="#e7ddd1" roughness={0.68} />
      </mesh>

      <mesh position={[0, scale.height / 2 + 0.12, 0.05]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.025, 0.025, scale.width + 0.5, 32]} />
        <meshStandardMaterial color={hardwareColor} metalness={0.82} roughness={0.24} />
      </mesh>

      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * (scale.width + 0.5) / 2, scale.height / 2 + 0.12, 0.05]} castShadow>
          {style === 'minimal' || style === 'modern' ? <boxGeometry args={[0.05, 0.05, 0.05]} /> : <sphereGeometry args={[0.05, 16, 16]} />}
          <meshStandardMaterial color={hardwareColor} metalness={0.84} roughness={0.22} />
        </mesh>
      ))}

      {panelsData.map((panel) => (
        <group key={panel.id} position={[panel.x, drapeY, 0.05 + panel.z]}>
          <mesh position={[0, 0, -0.025]} scale={[currentWidth * 1.02, totalHeight * 0.99, 1]} geometry={drapeGeometry} castShadow receiveShadow>
            <meshPhysicalMaterial color="#f1e8dc" roughness={0.92} opacity={0.18} transparent side={2} />
          </mesh>
          <mesh position={[0, 0, 0]} scale={[currentWidth, totalHeight, 1]} geometry={drapeGeometry} castShadow receiveShadow>
            <meshPhysicalMaterial {...materialProps} />
          </mesh>
          <mesh position={[0, totalHeight / 2 - 0.055, 0.03]} castShadow>
            <boxGeometry args={[currentWidth * 0.72, 0.065, 0.025]} />
            <meshStandardMaterial color="#efe5d8" roughness={0.72} />
          </mesh>
          {openAmount < 0.56 && (
            <group position={[panel.isLeft ? currentWidth * 0.18 : -currentWidth * 0.18, -totalHeight * 0.1, 0.08]}>
              <mesh castShadow>
                <torusGeometry args={[0.095, 0.01, 10, 34, Math.PI]} />
                <meshStandardMaterial color={style === 'luxury' ? '#c9a961' : '#9c826d'} metalness={0.72} roughness={0.24} />
              </mesh>
            </group>
          )}
        </group>
      ))}

      <mesh position={[0, -scale.height / 2 - dropOffset + 0.015, -0.08]} receiveShadow>
        <boxGeometry args={[scale.width + 0.22, 0.03, 0.12]} />
        <meshStandardMaterial color="#c7b29e" roughness={0.82} />
      </mesh>

      {showMeasurements && (
        <Text position={[0, scale.height / 2 + 0.35, 0]} fontSize={0.12} color="#ffffff" outlineWidth={0.01} outlineColor="#000000" anchorX="center" anchorY="middle">
          {Math.round(dimensions.width)} cm x {Math.round(dimensions.height)} cm
        </Text>
      )}
    </group>
  );
}
