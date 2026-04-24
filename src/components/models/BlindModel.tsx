import { useEffect, useMemo, useRef } from 'react';
import { Group, Mesh } from 'three';
import { Text } from '@react-three/drei';

type BlindStyle = 'roller' | 'venetian' | 'vertical' | 'roman';

interface Dimensions {
  width: number;
  height: number;
  drop: number;
}

interface BlindModelProps {
  style: BlindStyle;
  color: string;
  dimensions: Dimensions;
  opacity: number;
  texture: 'smooth' | 'fabric' | 'woven';
  showMeasurements: boolean;
  openAmount: number;
}

export default function BlindModel({ style, color, dimensions, opacity, texture, showMeasurements, openAmount }: BlindModelProps) {
  const groupRef = useRef<Group>(null);
  const slatsRef = useRef<Mesh[]>([]);

  const scale = useMemo(() => {
    const baseWidth = 3.8;
    const baseHeight = 2.8;
    return {
      width: (dimensions.width / 150) * baseWidth,
      height: (dimensions.height / 200) * baseHeight,
    };
  }, [dimensions]);

  useEffect(() => {
    slatsRef.current.forEach((slat) => {
      if (!slat) return;
      slat.rotation.x = style === 'venetian' ? openAmount * Math.PI * 0.35 : 0;
      slat.rotation.y = style === 'vertical' ? (1 - openAmount) * Math.PI * 0.4 : 0;
    });
  }, [openAmount, style]);

  const texturedProps = {
    roughness: texture === 'woven' ? 0.9 : texture === 'fabric' ? 0.8 : 0.4,
    metalness: texture === 'smooth' ? 0.1 : 0,
  };

  return (
    <group ref={groupRef} position={[0, 0.5, -2.65]}>
      <mesh position={[0, scale.height / 2 + 0.11, -0.01]} castShadow>
        <boxGeometry args={[scale.width + 0.16, 0.19, 0.14]} />
        <meshStandardMaterial color="#ece3d8" roughness={0.66} metalness={0.05} />
      </mesh>

      <mesh position={[0, scale.height / 2 + 0.06, 0]} castShadow>
        <boxGeometry args={[scale.width + 0.1, 0.08, 0.1]} />
        <meshStandardMaterial color="#f0f0f0" metalness={0.3} roughness={0.4} />
      </mesh>

      {style === 'roller' && (
        <group>
          <mesh position={[0, scale.height / 2 - (scale.height * openAmount) / 2, 0.01]} scale={[scale.width - 0.02, scale.height * openAmount || 0.01, 1]} castShadow receiveShadow>
            <planeGeometry args={[1, 1]} />
            <meshPhysicalMaterial color={color} {...texturedProps} transparent opacity={0.95} clearcoat={0.06} sheen={texture === 'woven' ? 0.3 : 0.15} />
          </mesh>
          <mesh position={[0, scale.height / 2 + 0.06, 0.01]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.03 + (1 - openAmount) * 0.04, 0.03 + (1 - openAmount) * 0.04, scale.width - 0.04, 24]} />
            <meshStandardMaterial color={color} {...texturedProps} />
          </mesh>
          <mesh position={[0, scale.height / 2 - scale.height * openAmount, 0.01]} castShadow>
            <boxGeometry args={[scale.width - 0.01, 0.04, 0.04]} />
            <meshStandardMaterial color="#e0e0e0" roughness={0.3} metalness={0.5} />
          </mesh>
          <mesh position={[scale.width / 2 - 0.07, scale.height / 2 - 0.35, 0.05]}>
            <cylinderGeometry args={[0.004, 0.004, 0.8, 10]} />
            <meshStandardMaterial color="#ffffff" roughness={0.6} />
          </mesh>
          <mesh position={[scale.width / 2 - 0.07, scale.height / 2 - 0.74, 0.05]}>
            <torusGeometry args={[0.05, 0.004, 8, 24]} />
            <meshStandardMaterial color="#ffffff" roughness={0.6} />
          </mesh>
        </group>
      )}

      {style === 'venetian' && (
        <group>
          {Array.from({ length: Math.floor(scale.height * 20) }).map((_, i) => {
            const slatCount = Math.floor(scale.height * 20);
            const slatHeight = scale.height / slatCount;
            const yPos = scale.height / 2 - i * slatHeight - slatHeight * 0.5 * (1 - openAmount);
            const isLast = i === slatCount - 1;

            if (isLast) {
              return (
                <mesh key="bottom-rail" position={[0, yPos, 0]} castShadow>
                  <boxGeometry args={[scale.width - 0.02, 0.04, 0.04]} />
                  <meshStandardMaterial color={color} metalness={0.2} roughness={0.5} />
                </mesh>
              );
            }

            return (
              <mesh key={i} ref={(el) => { if (el) slatsRef.current[i] = el; }} position={[0, yPos, 0]} castShadow receiveShadow>
                <boxGeometry args={[scale.width - 0.04, 0.045, 0.008]} />
                <meshStandardMaterial color={color} {...texturedProps} />
              </mesh>
            );
          })}
          {[-0.35, 0, 0.35].map((xRatio) => {
            const xPos = scale.width * xRatio;
            if (xRatio === 0 && scale.width < 1.5) return null;
            return (
              <group key={xRatio} position={[xPos, 0, 0]}>
                <mesh position={[0, 0, 0.026]}>
                  <planeGeometry args={[0.025, scale.height]} />
                  <meshStandardMaterial color="#f8f8f8" transparent opacity={0.9} />
                </mesh>
                <mesh position={[0, 0, -0.026]}>
                  <planeGeometry args={[0.025, scale.height]} />
                  <meshStandardMaterial color="#f8f8f8" transparent opacity={0.9} />
                </mesh>
              </group>
            );
          })}
        </group>
      )}

      {style === 'vertical' && (
        <group>
          {Array.from({ length: Math.floor(scale.width * 8) }).map((_, i) => {
            const slatCount = Math.floor(scale.width * 8);
            const slatWidth = scale.width / slatCount;
            const xPos = -scale.width / 2 + i * slatWidth + slatWidth / 2;

            return (
              <group key={i} position={[xPos, 0, 0]}>
                <mesh ref={(el) => { if (el) slatsRef.current[i] = el; }} castShadow receiveShadow>
                  <boxGeometry args={[slatWidth * 0.9, scale.height - 0.15, 0.008]} />
                  <meshPhysicalMaterial color={color} {...texturedProps} transparent opacity={0.95} roughness={0.7} sheen={0.3} />
                </mesh>
                <mesh position={[0, scale.height / 2 + 0.03, 0]}>
                  <boxGeometry args={[0.04, 0.06, 0.02]} />
                  <meshStandardMaterial color="#ffffff" roughness={0.5} />
                </mesh>
                <mesh position={[0, -scale.height / 2 + 0.08, 0]}>
                  <boxGeometry args={[slatWidth * 0.85, 0.05, 0.01]} />
                  <meshStandardMaterial color="#f0f0f0" />
                </mesh>
                <mesh position={[0, -scale.height / 2 + 0.06, 0]} rotation={[0, 0, Math.PI / 2]}>
                  <cylinderGeometry args={[0.002, 0.002, 0.05, 4]} />
                  <meshStandardMaterial color="#eeeeee" />
                </mesh>
              </group>
            );
          })}
        </group>
      )}

      {style === 'roman' && (
        <group>
          {Array.from({ length: 8 }).map((_, i) => {
            const sectionCount = 8;
            const sectionHeight = scale.height / sectionCount;
            const progress = (1 - openAmount) * sectionCount;
            const isFolded = i > sectionCount - progress;

            let yPos = scale.height / 2 - i * sectionHeight - sectionHeight / 2;
            let zOffset = 0;
            let currentOpacity = 1;
            let scaleY = 1;

            if (isFolded) {
              const stackIndex = i - (sectionCount - Math.ceil(progress));
              yPos = scale.height / 2 - (sectionCount - progress) * sectionHeight;
              zOffset = -stackIndex * 0.01;
              currentOpacity = 0.5;
              scaleY = 0.1;
            }

            return (
              <group key={i} position={[0, yPos, zOffset]}>
                <mesh castShadow receiveShadow scale={[1, scaleY, 1]}>
                  <planeGeometry args={[scale.width, sectionHeight, 16, 4]} />
                  <meshPhysicalMaterial color={color} {...texturedProps} transparent opacity={opacity * currentOpacity} sheen={0.4} />
                </mesh>
                <mesh position={[0, -sectionHeight / 2, 0.01]} rotation={[0, 0, Math.PI / 2]}>
                  <cylinderGeometry args={[0.005, 0.005, scale.width, 8]} />
                  <meshStandardMaterial color="#d0d0d0" />
                </mesh>
              </group>
            );
          })}
          {[-0.3, 0.3].map((x) => (
            <mesh key={x} position={[scale.width * x, 0, -0.01]}>
              <cylinderGeometry args={[0.002, 0.002, scale.height, 8]} />
              <meshStandardMaterial color="#ffffff" />
            </mesh>
          ))}
        </group>
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
