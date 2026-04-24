import { useState, useRef, useEffect, useCallback } from 'react';
import { Text, Line } from '@react-three/drei';
import { IfInSessionMode, useXRHitTest, useXRInputSourceEvent } from '@react-three/xr';
import { Group, Matrix4, Vector3 } from 'three';
import { useFrame } from '@react-three/fiber';
import CurtainModel from './models/CurtainModel';
import BlindModel from './models/BlindModel';
import ShadeModel from './models/ShadeModel';
import DrapeModel from './models/DrapeModel';
import type { CornerDetection, DetectionStage, ProductConfig, SurfaceDetection } from '../types';

interface ARExperienceProps {
  config: ProductConfig;
  onCornerDetectionChange?: (detection: CornerDetection) => void;
  onSurfaceDetected?: (surface: SurfaceDetection) => void;
}

const matrixHelper = new Matrix4();
const hitTestPosition = new Vector3();

export function ARExperience({ config, onCornerDetectionChange, onSurfaceDetected }: ARExperienceProps) {
  const {
    selectedProduct,
    curtainStyle,
    blindStyle,
    shadeStyle,
    drapeStyle,
    color,
    dimensions,
    opacity,
    texture,
    showMeasurements,
    openAmount,
    panelCount,
  } = config;

  const [cornerDetection, setCornerDetection] = useState<CornerDetection>({
    corners: [],
    stage: 'idle',
    boundingBox: null,
    surfaceArea: 0,
    perspectiveMatrix: null,
  });

  const previewRef = useRef<Group>(null);

  const renderConfiguredModel = (forPlacement = false) => {
    const placementOffset = forPlacement ? [0, -0.5, 2.65] : [0, 0, 0];

    return (
      <group position={placementOffset as [number, number, number]}>
        {selectedProduct === 'curtain' && (
          <CurtainModel
            style={curtainStyle}
            color={color}
            dimensions={dimensions}
            opacity={opacity}
            texture={texture}
            showMeasurements={showMeasurements}
            openAmount={openAmount}
            panelCount={panelCount}
          />
        )}

        {selectedProduct === 'blind' && (
          <BlindModel
            style={blindStyle}
            color={color}
            dimensions={dimensions}
            opacity={opacity}
            texture={texture}
            showMeasurements={showMeasurements}
            openAmount={openAmount}
          />
        )}

        {selectedProduct === 'shade' && (
          <ShadeModel
            style={shadeStyle}
            color={color}
            dimensions={dimensions}
            opacity={opacity}
            texture={texture}
            showMeasurements={showMeasurements}
            openAmount={openAmount}
          />
        )}

        {selectedProduct === 'drape' && (
          <DrapeModel
            style={drapeStyle}
            color={color}
            dimensions={dimensions}
            opacity={opacity}
            texture={texture}
            showMeasurements={showMeasurements}
            openAmount={openAmount}
            panelCount={panelCount}
          />
        )}
      </group>
    );
  };

  const validateCorners = useCallback((corners: Vector3[]): boolean => {
    if (corners.length !== 4) return false;

    const minDistance = 0.1;
    for (let i = 0; i < corners.length; i++) {
      for (let j = i + 1; j < corners.length; j++) {
        if (corners[i].distanceTo(corners[j]) < minDistance) {
          return false;
        }
      }
    }

    return true;
  }, []);

  const calculateSurfaceArea = useCallback((corners: Vector3[]): number => {
    if (corners.length !== 4) return 0;

    const area1 =
      Math.abs(
        corners[0].x * (corners[1].y - corners[3].y) +
          corners[1].x * (corners[3].y - corners[0].y) +
          corners[3].x * (corners[0].y - corners[1].y)
      ) / 2;

    const area2 =
      Math.abs(
        corners[0].x * (corners[3].y - corners[2].y) +
          corners[3].x * (corners[2].y - corners[0].y) +
          corners[2].x * (corners[0].y - corners[3].y)
      ) / 2;

    return (area1 + area2) / 2;
  }, []);

  const computeBoundingBox = useCallback((corners: Vector3[]) => {
    if (corners.length === 0) return null;

    const min = new Vector3(Infinity, Infinity, Infinity);
    const max = new Vector3(-Infinity, -Infinity, -Infinity);

    corners.forEach((corner) => {
      min.min(corner);
      max.max(corner);
    });

    return {
      min,
      max,
      center: new Vector3().addVectors(min, max).multiplyScalar(0.5),
    };
  }, []);

  const computePerspectiveMatrix = useCallback(
    (corners: Vector3[]): Matrix4 => {
      if (corners.length !== 4) return new Matrix4();

      const matrix = new Matrix4();
      const boundingBox = computeBoundingBox(corners);
      if (boundingBox) {
        const scaleX = boundingBox.max.x - boundingBox.min.x;
        const scaleY = boundingBox.max.y - boundingBox.min.y;
        matrix.makeScale(scaleX, scaleY, 1);
        matrix.setPosition(boundingBox.center.x, boundingBox.center.y, 0);
      }

      return matrix;
    },
    [computeBoundingBox]
  );

  const addCorner = useCallback(
    (position: Vector3) => {
      setCornerDetection((prev) => {
        const newCorners = [...prev.corners, position.clone()];

        if (newCorners.length === 4) {
          if (validateCorners(newCorners)) {
            const boundingBox = computeBoundingBox(newCorners);
            const surfaceArea = calculateSurfaceArea(newCorners);

            const nextDetection: CornerDetection = {
              corners: newCorners,
              stage: 'completed',
              boundingBox,
              surfaceArea,
              perspectiveMatrix: computePerspectiveMatrix(newCorners),
            };

            if (onSurfaceDetected && boundingBox) {
              onSurfaceDetected({
                corners: {
                  topLeft: newCorners[0],
                  topRight: newCorners[1],
                  bottomLeft: newCorners[2],
                  bottomRight: newCorners[3],
                },
                boundingBox,
                perspectiveMatrix: computePerspectiveMatrix(newCorners),
                surfaceArea,
                normal: new Vector3(0, 0, 1),
              });
            }

            return nextDetection;
          }

          return {
            corners: [],
            stage: 'idle',
            boundingBox: null,
            surfaceArea: 0,
            perspectiveMatrix: null,
          };
        }

        return {
          ...prev,
          corners: newCorners,
          stage: 'detecting' as DetectionStage,
        };
      });
    },
    [calculateSurfaceArea, computeBoundingBox, computePerspectiveMatrix, onSurfaceDetected, validateCorners]
  );

  useXRHitTest(
    (results, getWorldMatrix) => {
      if (cornerDetection.stage !== 'completed' && results.length > 0) {
        getWorldMatrix(matrixHelper, results[0]);
        hitTestPosition.setFromMatrixPosition(matrixHelper);
      }
    },
    'viewer',
    'plane'
  );

  useFrame(() => {
    if (cornerDetection.stage !== 'completed' && previewRef.current) {
      previewRef.current.position.copy(hitTestPosition);
    }
  });

  useXRInputSourceEvent(
    'all',
    'select',
    () => {
      if (cornerDetection.stage !== 'completed') {
        addCorner(hitTestPosition);
      }
    },
    [addCorner, cornerDetection.stage]
  );

  useEffect(() => {
    onCornerDetectionChange?.(cornerDetection);
  }, [cornerDetection, onCornerDetectionChange]);

  return (
    <>
      <IfInSessionMode deny="immersive-ar">
        {renderConfiguredModel(false)}
      </IfInSessionMode>

      <IfInSessionMode allow="immersive-ar">
        {cornerDetection.stage !== 'completed' && (
          <group ref={previewRef}>
            <Text position={[0, 1.5, 0]} fontSize={0.1} color="#667eea" anchorX="center" anchorY="middle" outlineWidth={0.01} outlineColor="#ffffff">
              {cornerDetection.corners.length === 0 && 'Tap top-left corner'}
              {cornerDetection.corners.length === 1 && 'Tap top-right corner'}
              {cornerDetection.corners.length === 2 && 'Tap bottom-left corner'}
              {cornerDetection.corners.length === 3 && 'Tap bottom-right corner'}
            </Text>

            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
              <ringGeometry args={[0.15, 0.2, 32]} />
              <meshBasicMaterial color="#667eea" transparent opacity={0.8} />
            </mesh>

            {cornerDetection.corners.map((corner, index) => (
              <group key={index} position={corner}>
                <mesh position={[0, 0.02, 0]}>
                  <sphereGeometry args={[0.03, 16, 16]} />
                  <meshBasicMaterial color="#4ade80" />
                </mesh>
                <Text position={[0, 0.1, 0]} fontSize={0.05} color="#4ade80" anchorX="center" anchorY="middle">
                  {index + 1}
                </Text>
              </group>
            ))}

            {cornerDetection.corners.length >= 2 && <Line points={cornerDetection.corners} color="#667eea" lineWidth={3} />}
          </group>
        )}

        {cornerDetection.stage === 'completed' && cornerDetection.boundingBox && (
          <group position={cornerDetection.boundingBox.center}>
            <group
              scale={[
                Math.max((cornerDetection.boundingBox.max.x - cornerDetection.boundingBox.min.x) / 4.2, 0.4),
                Math.max((cornerDetection.boundingBox.max.y - cornerDetection.boundingBox.min.y) / 3.1, 0.45),
                1,
              ]}
            >
              {renderConfiguredModel(true)}
            </group>

            <Text
              position={[0, cornerDetection.boundingBox.max.y - cornerDetection.boundingBox.min.y + 0.5, 0]}
              fontSize={0.08}
              color="#4ade80"
              anchorX="center"
              anchorY="middle"
              outlineWidth={0.01}
              outlineColor="#ffffff"
            >
              Placement locked. Walk around to inspect.
            </Text>

            <Line points={[...cornerDetection.corners, cornerDetection.corners[0]]} color="#4ade80" lineWidth={5} />

            <Text
              position={[0, cornerDetection.boundingBox.min.y - 0.3, 0]}
              fontSize={0.06}
              color="#ffffff"
              anchorX="center"
              anchorY="middle"
              outlineWidth={0.01}
              outlineColor="#000000"
            >
              Area: {(cornerDetection.surfaceArea * 10000).toFixed(1)} cm²
            </Text>
          </group>
        )}
      </IfInSessionMode>
    </>
  );
}
