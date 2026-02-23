import { useRef, useMemo, useState, useEffect } from 'react';
import { Group, Mesh } from 'three';
import { Text } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';

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

export default function BlindModel({
  style,
  color,
  dimensions,
  opacity,
  texture,
  showMeasurements,
  openAmount
}: BlindModelProps) {

  const groupRef = useRef<Group>(null);
  const slatsRef = useRef<(Mesh | null)[]>([]);
  const animatedOpenAmount = useRef(openAmount);

  const scale = useMemo(() => {
    const baseWidth = 3.8; // Match window glass width
    const baseHeight = 2.8; // Match window glass height
    return {
      width: (dimensions.width / 150) * baseWidth,
      height: (dimensions.height / 200) * baseHeight,
    };
  }, [dimensions]);

  useFrame((_, delta) => {
    // Smoothing: Lerp towards target openAmount
    const lerpFactor = 1 - Math.pow(0.001, delta);
    animatedOpenAmount.current += (openAmount - animatedOpenAmount.current) * Math.min(lerpFactor * 5, 0.2);

    // Update style-specific properties based on animatedOpenAmount
    if (style === 'venetian') {
      slatsRef.current.forEach((slat) => {
        if (slat) slat.rotation.x = animatedOpenAmount.current * Math.PI * 0.35;
      });
    }
    if (style === 'vertical') {
      slatsRef.current.forEach((slat) => {
        if (slat) slat.rotation.y = (1 - animatedOpenAmount.current) * Math.PI * 0.4;
      });
    }
  });

  // Local state for smooth transition on Roller/Roman which need re-render
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

  // Use smoothAmount for the render logic to ensure smoothness
  const displayAmount = smoothAmount;

  const texturedProps = {
    roughness: texture === 'woven' ? 0.9 : texture === 'fabric' ? 0.8 : 0.4,
    metalness: texture === 'smooth' ? 0.1 : 0,
  };

  return (
    <group ref={groupRef} position={[0, 0.5, -2.65]}>
      {/* Headrail */}
      <mesh position={[0, scale.height / 2 + 0.06, 0]} castShadow>
        <boxGeometry args={[scale.width + 0.1, 0.08, 0.1]} />
        <meshStandardMaterial color="#f0f0f0" metalness={0.3} roughness={0.4} />
      </mesh>

      {/* Roller Blind */}
      {style === 'roller' && (
        <group>
          <mesh
            position={[0, scale.height / 2 - (scale.height * displayAmount) / 2, 0.01]}
            scale={[scale.width - 0.02, scale.height * displayAmount || 0.01, 1]}
            castShadow
            receiveShadow
          >
            <planeGeometry args={[1, 1]} />
            <meshPhysicalMaterial
              color={color}
              {...texturedProps}
              transparent
              opacity={0.95}
            />
          </mesh>
          {/* Rolled fabric */}
          <mesh
            position={[0, scale.height / 2 + 0.06, 0.01]}
            rotation={[0, 0, Math.PI / 2]}
          >
            <cylinderGeometry args={[0.03 + (1 - displayAmount) * 0.04, 0.03 + (1 - displayAmount) * 0.04, scale.width - 0.04, 24]} />
            <meshStandardMaterial color={color} {...texturedProps} />
          </mesh>
          {/* Bottom bar */}
          <mesh
            position={[0, scale.height / 2 - (scale.height * displayAmount), 0.01]}
            castShadow
          >
            <boxGeometry args={[scale.width - 0.01, 0.04, 0.04]} />
            <meshStandardMaterial color="#e0e0e0" roughness={0.3} metalness={0.5} />
          </mesh>
        </group>
      )}

      {/* Venetian Blind - horizontal slats */}
      {style === 'venetian' && (
        <group>
          {Array.from({ length: Math.floor(scale.height * 20) }).map((_, i) => {
            const slatCount = Math.floor(scale.height * 20);
            const slatHeight = scale.height / slatCount;
            const yPos = scale.height / 2 - i * slatHeight - slatHeight * 0.5 * (1 - displayAmount);
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
              <mesh
                key={i}
                ref={(el) => { if (el) slatsRef.current[i] = el; }}
                position={[0, yPos, 0]}
                castShadow
                receiveShadow
              >
                <boxGeometry args={[scale.width - 0.04, 0.05, 0.003]} />
                <meshStandardMaterial color={color} {...texturedProps} />
              </mesh>
            );
          })}
          {/* Detailed Ladder Tapes */}
          {[-0.35, 0, 0.35].map((xRatio) => {
            const xPos = scale.width * xRatio;
            // Skip center tape if window is narrow
            if (xRatio === 0 && scale.width < 1.5) return null;
            return (
              <group key={xRatio} position={[xPos, 0, 0]}>
                {/* Front tape */}
                <mesh position={[0, 0, 0.026]}>
                  <planeGeometry args={[0.025, scale.height]} />
                  <meshStandardMaterial color="#f8f8f8" transparent opacity={0.9} />
                </mesh>
                {/* Back tape */}
                <mesh position={[0, 0, -0.026]}>
                  <planeGeometry args={[0.025, scale.height]} />
                  <meshStandardMaterial color="#f8f8f8" transparent opacity={0.9} />
                </mesh>
              </group>
            );
          })}
        </group>
      )}

      {/* Vertical Blind */}
      {style === 'vertical' && (
        <group>
          {Array.from({ length: Math.floor(scale.width * 8) }).map((_, i) => {
            const slatCount = Math.floor(scale.width * 8);
            const slatWidth = scale.width / slatCount;
            const xPos = -scale.width / 2 + i * slatWidth + slatWidth / 2;

            return (
              <group key={i} position={[xPos, 0, 0]}>
                <mesh
                  ref={(el) => { if (el) slatsRef.current[i] = el; }}
                  castShadow
                  receiveShadow
                >
                  <boxGeometry args={[slatWidth * 0.9, scale.height - 0.15, 0.004]} />
                  <meshPhysicalMaterial
                    color={color}
                    {...texturedProps}
                    transparent
                    opacity={0.95}
                    roughness={0.7}
                    sheen={0.3}
                  />
                </mesh>
                {/* Hanger Carrier */}
                <mesh position={[0, scale.height / 2 + 0.03, 0]}>
                  <boxGeometry args={[0.04, 0.06, 0.02]} />
                  <meshStandardMaterial color="#ffffff" roughness={0.5} />
                </mesh>
                {/* Bottom Weight */}
                <mesh position={[0, -scale.height / 2 + 0.08, 0]}>
                  <boxGeometry args={[slatWidth * 0.85, 0.05, 0.01]} />
                  <meshStandardMaterial color="#f0f0f0" />
                </mesh>
                {/* Linking Chain (simplified) */}
                <mesh position={[0, -scale.height / 2 + 0.06, 0]} rotation={[0, 0, Math.PI / 2]}>
                  <cylinderGeometry args={[0.002, 0.002, 0.05, 4]} />
                  <meshStandardMaterial color="#eeeeee" />
                </mesh>
              </group>
            );
          })}
        </group>
      )}

      {/* Roman Blind */}
      {style === 'roman' && (
        <group>
          {Array.from({ length: 8 }).map((_, i) => {
            const sectionCount = 8;
            const sectionHeight = scale.height / sectionCount;

            // Core Roman stacking logic:
            // As user opens (openAmount closer to 0), pods stack up
            const progress = (1 - displayAmount) * sectionCount;
            const isFolded = i > (sectionCount - progress);

            // Calculate position
            let yPos = scale.height / 2 - i * sectionHeight - sectionHeight / 2;
            let zOffset = 0;
            let currentOpacity = 1;
            let scaleY = 1;

            if (isFolded) {
              // Stack behind the last visible section
              const stackIndex = i - (sectionCount - Math.ceil(progress));
              yPos = scale.height / 2 - (sectionCount - progress) * sectionHeight;
              zOffset = -stackIndex * 0.01;
              currentOpacity = 0.5; // Visual hint of stack
              scaleY = 0.1; // Highly compressed
            }

            return (
              <group key={i} position={[0, yPos, zOffset]}>
                <mesh castShadow receiveShadow scale={[1, scaleY, 1]}>
                  <planeGeometry args={[scale.width, sectionHeight, 16, 4]} />
                  <meshPhysicalMaterial
                    color={color}
                    {...texturedProps}
                    transparent
                    opacity={opacity * currentOpacity}
                    sheen={0.4}
                  />
                </mesh>
                {/* Horizontal Dowel Rod */}
                <mesh position={[0, -sectionHeight / 2, 0.01]} rotation={[0, 0, Math.PI / 2]}>
                  <cylinderGeometry args={[0.005, 0.005, scale.width, 8]} />
                  <meshStandardMaterial color="#d0d0d0" />
                </mesh>
              </group>
            );
          })}
          {/* Lift Cords */}
          {[-0.3, 0.3].map(x => (
            <mesh key={x} position={[scale.width * x, 0, -0.01]}>
              <cylinderGeometry args={[0.002, 0.002, scale.height, 8]} />
              <meshStandardMaterial color="#ffffff" />
            </mesh>
          ))}
        </group>
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
