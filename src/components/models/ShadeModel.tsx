import { useMemo, useRef } from 'react';
import { Group, PlaneGeometry, Vector3 } from 'three';
import { Text } from '@react-three/drei';
import type { ShadeStyle, Dimensions } from '../../types';

interface ShadeModelProps {
  style: ShadeStyle;
  color: string;
  dimensions: Dimensions;
  opacity: number;
  texture: 'smooth' | 'fabric' | 'woven';
  showMeasurements: boolean;
  openAmount: number;
}

export default function ShadeModel({ style, color, dimensions, opacity, texture, showMeasurements, openAmount }: ShadeModelProps) {
  const groupRef = useRef<Group>(null);

  const scale = useMemo(() => {
    const baseWidth = 3.8;
    const baseHeight = 2.8;
    return {
      width: (dimensions.width / 150) * baseWidth,
      height: (dimensions.height / 200) * baseHeight,
    };
  }, [dimensions]);

  const dropHeight = scale.height * openAmount;

  const pleatedGeometry = useMemo(() => {
    const folds = 40;
    const geometry = new PlaneGeometry(1, 1, 2, folds);
    const pos = geometry.getAttribute('position');
    const vertex = new Vector3();

    for (let i = 0; i < pos.count; i++) {
      vertex.fromBufferAttribute(pos, i);
      const y = vertex.y + 0.5;
      const foldIndex = Math.floor(y * folds);
      const isOut = foldIndex % 2 === 0;
      const zOffset = isOut ? 0.03 : -0.03;
      const compression = 1.0 - openAmount * 0.5;
      pos.setZ(i, zOffset * compression);
    }

    geometry.computeVertexNormals();
    return geometry;
  }, [openAmount]);

  const texturedProps = {
    roughness: texture === 'woven' ? 0.9 : texture === 'fabric' ? 0.8 : 0.5,
    metalness: texture === 'smooth' ? 0.1 : 0,
  };

  return (
    <group ref={groupRef} position={[0, 0.5, -2.65]}>
      <mesh position={[0, scale.height / 2 + 0.11, -0.01]} castShadow>
        <boxGeometry args={[scale.width + 0.18, 0.2, 0.14]} />
        <meshStandardMaterial color="#ece3d8" roughness={0.7} metalness={0.05} />
      </mesh>

      <mesh position={[0, scale.height / 2 + 0.06, 0]} castShadow>
        <boxGeometry args={[scale.width + 0.1, 0.08, 0.1]} />
        <meshStandardMaterial color="#f0f0f0" metalness={0.3} roughness={0.4} />
      </mesh>

      {style === 'pleated' && (
        <mesh position={[0, scale.height / 2 - dropHeight / 2, 0]} scale={[scale.width, dropHeight || 0.01, 1]} geometry={pleatedGeometry} castShadow receiveShadow>
          <meshPhysicalMaterial color={color} {...texturedProps} transparent opacity={0.9} sheen={texture === 'woven' ? 0.28 : 0.14} />
        </mesh>
      )}

      {style === 'honeycomb' && (
        <group position={[0, scale.height / 2 - dropHeight / 2, 0]}>
          <mesh position={[0, 0, 0.02]} scale={[scale.width, dropHeight || 0.01, 1]} geometry={pleatedGeometry} castShadow receiveShadow>
            <meshPhysicalMaterial color={color} {...texturedProps} transparent opacity={opacity * 0.88} clearcoat={0.03} />
          </mesh>
          <mesh position={[0, 0, -0.02]} scale={[scale.width, dropHeight || 0.01, -1]} geometry={pleatedGeometry} castShadow receiveShadow>
            <meshPhysicalMaterial color={color} {...texturedProps} transparent opacity={opacity * 0.88} clearcoat={0.03} />
          </mesh>
          {[-scale.width / 2, scale.width / 2].map((x) => (
            <mesh key={x} position={[x, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
              <cylinderGeometry args={[0.04, 0.04, 0.01, 6]} />
              <meshStandardMaterial color={color} roughness={0.5} />
            </mesh>
          ))}
        </group>
      )}

      {style === 'solar' && (
        <group>
          <mesh position={[0, scale.height / 2 - dropHeight / 2, 0]} scale={[scale.width, dropHeight || 0.01, 1]} castShadow receiveShadow>
            <planeGeometry args={[1, 1]} />
            <meshPhysicalMaterial color={color} {...texturedProps} transmission={0.6} transparent opacity={0.85} clearcoat={0.08} />
          </mesh>
          <mesh position={[0, scale.height / 2 + 0.06, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.035 + (1 - openAmount) * 0.02, 0.035 + (1 - openAmount) * 0.02, scale.width - 0.02, 24]} />
            <meshPhysicalMaterial color={color} {...texturedProps} clearcoat={0.1} clearcoatRoughness={0.8} />
          </mesh>
        </group>
      )}

      {style === 'bamboo' && (
        <group>
          {Array.from({ length: Math.max(1, Math.floor(dropHeight * 25)) }).map((_, i) => {
            const slatCount = Math.max(1, Math.floor(dropHeight * 25));
            const slatSpacing = dropHeight / slatCount;
            const yPos = scale.height / 2 - i * slatSpacing - slatSpacing / 2;

            return (
              <mesh key={i} position={[0, yPos, 0]} castShadow receiveShadow>
                <boxGeometry args={[scale.width - 0.02, slatSpacing * 0.8, 0.008]} />
                <meshStandardMaterial color={color} roughness={0.95} metalness={0} />
              </mesh>
            );
          })}
          <mesh position={[0, scale.height / 2 - dropHeight - 0.02, 0]} castShadow>
            <boxGeometry args={[scale.width, 0.04, 0.04]} />
            <meshStandardMaterial color={color} roughness={0.9} />
          </mesh>
        </group>
      )}

      {style !== 'bamboo' && (
        <mesh position={[0, scale.height / 2 - dropHeight - 0.02, 0]} castShadow>
          <boxGeometry args={[scale.width, 0.04, 0.06]} />
          <meshStandardMaterial color="#e0e0e0" roughness={0.3} metalness={0.4} />
        </mesh>
      )}

      <mesh position={[0, -scale.height / 2 - 0.02, -0.08]} receiveShadow>
        <boxGeometry args={[scale.width + 0.18, 0.03, 0.12]} />
        <meshStandardMaterial color="#cab8a6" roughness={0.82} />
      </mesh>

      {showMeasurements && (
        <>
          <Text position={[0, scale.height / 2 + 0.25, 0]} fontSize={0.12} color="#ffffff" outlineWidth={0.01} outlineColor="#000000" anchorX="center" anchorY="middle">
            {Math.round(dimensions.width)} cm
          </Text>
          <Text position={[scale.width / 2 + 0.25, 0, 0]} fontSize={0.12} color="#ffffff" outlineWidth={0.01} outlineColor="#000000" anchorX="center" anchorY="middle" rotation={[0, 0, -Math.PI / 2]}>
            {Math.round(dimensions.height)} cm
          </Text>
        </>
      )}
    </group>
  );
}
