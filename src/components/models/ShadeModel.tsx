import { useRef, useMemo, useState, useEffect } from 'react';
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

export default function ShadeModel({
  style,
  color,
  dimensions,
  opacity,
  texture,
  showMeasurements,
  openAmount
}: ShadeModelProps) {

  const groupRef = useRef<Group>(null);

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

  const dropHeight = scale.height * displayAmount;

  // Pleated geometry - accordion folds
  const pleatedGeometry = useMemo(() => {
    const folds = 40;
    const geometry = new PlaneGeometry(1, 1, 2, folds);
    const pos = geometry.getAttribute('position');
    const v = new Vector3();

    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      const y = v.y + 0.5;
      const foldIndex = Math.floor(y * folds);
      const isOut = foldIndex % 2 === 0;
      const zOffset = isOut ? 0.03 : -0.03;

      // Compression when raised
      const compression = 1.0 - displayAmount * 0.5;
      pos.setZ(i, zOffset * compression);
    }

    geometry.computeVertexNormals();
    return geometry;
  }, [displayAmount]);

  const texturedProps = {
    roughness: texture === 'woven' ? 0.9 : texture === 'fabric' ? 0.8 : 0.5,
    metalness: texture === 'smooth' ? 0.1 : 0,
  };

  return (
    <group ref={groupRef} position={[0, 0.5, -2.65]}>
      {/* Headrail */}
      <mesh position={[0, scale.height / 2 + 0.06, 0]} castShadow>
        <boxGeometry args={[scale.width + 0.1, 0.08, 0.1]} />
        <meshStandardMaterial color="#f0f0f0" metalness={0.3} roughness={0.4} />
      </mesh>

      {/* Pleated Shade */}
      {style === 'pleated' && (
        <mesh
          position={[0, scale.height / 2 - dropHeight / 2, 0]}
          scale={[scale.width, dropHeight || 0.01, 1]}
          geometry={pleatedGeometry}
          castShadow
          receiveShadow
        >
          <meshPhysicalMaterial
            color={color}
            {...texturedProps}
            transparent
            opacity={0.9}
          />
        </mesh>
      )}

      {/* Honeycomb/Cellular Shade - double layer */}
      {style === 'honeycomb' && (
        <group position={[0, scale.height / 2 - dropHeight / 2, 0]}>
          <mesh
            position={[0, 0, 0.02]}
            scale={[scale.width, dropHeight || 0.01, 1]}
            geometry={pleatedGeometry}
            castShadow
            receiveShadow
          >
            <meshPhysicalMaterial
              color={color}
              {...texturedProps}
              transparent
              opacity={opacity * 0.88}
            />
          </mesh>
          <mesh
            position={[0, 0, -0.02]}
            scale={[scale.width, dropHeight || 0.01, -1]}
            geometry={pleatedGeometry}
            castShadow
            receiveShadow
          >
            <meshPhysicalMaterial
              color={color}
              {...texturedProps}
              transparent
              opacity={opacity * 0.88}
            />
          </mesh>
          {/* Honeycomb Side Caps (Hexagonal) */}
          {[-scale.width / 2, scale.width / 2].map((x) => (
            <mesh key={x} position={[x, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
              <cylinderGeometry args={[0.04, 0.04, 0.01, 6]} />
              <meshStandardMaterial color={color} roughness={0.5} />
            </mesh>
          ))}
        </group>
      )}

      {/* Solar Shade - flat screen */}
      {style === 'solar' && (
        <group>
          <mesh
            position={[0, scale.height / 2 - dropHeight / 2, 0]}
            scale={[scale.width, dropHeight || 0.01, 1]}
            castShadow
            receiveShadow
          >
            <planeGeometry args={[1, 1]} />
            <meshPhysicalMaterial
              color={color}
              {...texturedProps}
              transmission={0.6}
              transparent
              opacity={0.85}
            />
          </mesh>
          {/* Rolled fabric */}
          <mesh
            position={[0, scale.height / 2 + 0.06, 0]}
            rotation={[0, 0, Math.PI / 2]}
          >
            <cylinderGeometry args={[0.035 + (1 - displayAmount) * 0.02, 0.035 + (1 - displayAmount) * 0.02, scale.width - 0.02, 24]} />
            <meshPhysicalMaterial
              color={color}
              {...texturedProps}
              clearcoat={0.1}
              clearcoatRoughness={0.8}
            />
          </mesh>
        </group>
      )}

      {/* Bamboo Shade - woven slats */}
      {style === 'bamboo' && (
        <group>
          {Array.from({ length: Math.floor(dropHeight * 25) }).map((_, i) => {
            const slatSpacing = dropHeight / Math.floor(dropHeight * 25);
            const yPos = scale.height / 2 - i * slatSpacing - slatSpacing / 2;

            return (
              <mesh
                key={i}
                position={[0, yPos, 0]}
                castShadow
                receiveShadow
              >
                <boxGeometry args={[scale.width - 0.02, slatSpacing * 0.8, 0.006]} />
                <meshStandardMaterial
                  color={color}
                  roughness={0.95}
                  metalness={0}
                />
              </mesh>
            );
          })}
          {/* Bottom rail */}
          <mesh position={[0, scale.height / 2 - dropHeight - 0.02, 0]} castShadow>
            <boxGeometry args={[scale.width, 0.04, 0.04]} />
            <meshStandardMaterial color={color} roughness={0.9} />
          </mesh>
        </group>
      )}

      {/* Bottom Rail for non-bamboo */}
      {style !== 'bamboo' && (
        <mesh position={[0, scale.height / 2 - dropHeight - 0.02, 0]} castShadow>
          <boxGeometry args={[scale.width, 0.04, 0.06]} />
          <meshStandardMaterial color="#e0e0e0" roughness={0.3} metalness={0.4} />
        </mesh>
      )}

      {showMeasurements && (
        <>
          <Text
            position={[0, scale.height / 2 + 0.25, 0]}
            fontSize={0.12}
            color="#ffffff"
            outlineWidth={0.01}
            outlineColor="#000000"
            anchorX="center"
            anchorY="middle"
          >
            {Math.round(dimensions.width)} cm
          </Text>
          <Text
            position={[scale.width / 2 + 0.25, 0, 0]}
            fontSize={0.12}
            color="#ffffff"
            outlineWidth={0.01}
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
