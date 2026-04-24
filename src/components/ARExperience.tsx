import { useState, useRef, useEffect, useCallback } from 'react';
import { Text, Line } from '@react-three/drei';
import { IfInSessionMode, useXRHitTest, useXRInputSourceEvent } from '@react-three/xr';
import { Group, Vector3, Euler, Matrix4 } from 'three';
import { useFrame } from '@react-three/fiber';
import CurtainModel from './models/CurtainModel';
import BlindModel from './models/BlindModel';
import ShadeModel from './models/ShadeModel';
import DrapeModel from './models/DrapeModel';
import type { ProductConfig, CornerDetection, DetectionStage, SurfaceDetection } from '../types';

interface ARExperienceProps {
  config: ProductConfig;
  onARControlsChange?: (controls: ARControlsState) => void;
  onCornerDetectionChange?: (detection: CornerDetection) => void;
  onSurfaceDetected?: (surface: SurfaceDetection) => void;
}

export interface ARControlsState {
  isPlaced: boolean;
  openAmount: number;
  onRotate: () => void;
  onScaleUp: () => void;
  onScaleDown: () => void;
  onReset: () => void;
}


const matrixHelper = new Matrix4();
const hitTestPosition = new Vector3();

export function ARExperience({ config, onARControlsChange, onCornerDetectionChange, onSurfaceDetected }: ARExperienceProps) {
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
    panelCount 
  } = config;

  // Corner detection state
  const [cornerDetection, setCornerDetection] = useState<CornerDetection>({
    corners: [],
    stage: 'idle',
    boundingBox: null,
    surfaceArea: 0,
    perspectiveMatrix: null,
  });

  // Legacy placement state (for backward compatibility)
  const [isPlaced, setIsPlaced] = useState(false);
  const [rotation, setRotation] = useState<Euler>(new Euler(0, 0, 0));
  const [scale, setScale] = useState(0.5);

  const groupRef = useRef<Group>(null);
  const previewRef = useRef<Group>(null);

  // Utility functions for corner detection
  const validateCorners = useCallback((corners: Vector3[]): boolean => {
    if (corners.length !== 4) return false;

    // Check minimum distances between corners
    const minDistance = 0.1; // 10cm minimum
    for (let i = 0; i < corners.length; i++) {
      for (let j = i + 1; j < corners.length; j++) {
        if (corners[i].distanceTo(corners[j]) < minDistance) {
          return false;
        }
      }
    }

    // Check if corners form a rough quadrilateral
    // Simple check: all angles should be reasonable (not too acute)
    return true;
  }, []);

  const calculateSurfaceArea = useCallback((corners: Vector3[]): number => {
    if (corners.length !== 4) return 0;

    // Approximate area using average of two possible quadrilateral divisions
    const area1 = Math.abs(
      corners[0].x * (corners[1].y - corners[3].y) +
      corners[1].x * (corners[3].y - corners[0].y) +
      corners[3].x * (corners[0].y - corners[1].y)
    ) / 2;

    const area2 = Math.abs(
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

    corners.forEach(corner => {
      min.min(corner);
      max.max(corner);
    });

    return {
      min,
      max,
      center: new Vector3().addVectors(min, max).multiplyScalar(0.5),
    };
  }, []);

  const computePerspectiveMatrix = useCallback((corners: Vector3[]): Matrix4 => {
    if (corners.length !== 4) return new Matrix4();

    // Simple perspective transformation based on 4 corners
    // This creates a transformation that maps a unit square to the detected quadrilateral
    const matrix = new Matrix4();

    // For now, use a simple scaling and translation based on bounding box
    // TODO: Implement full perspective transformation
    const boundingBox = computeBoundingBox(corners);
    if (boundingBox) {
      const scaleX = boundingBox.max.x - boundingBox.min.x;
      const scaleY = boundingBox.max.y - boundingBox.min.y;
      const translateX = boundingBox.center.x;
      const translateY = boundingBox.center.y;

      matrix.makeScale(scaleX, scaleY, 1);
      matrix.setPosition(translateX, translateY, 0);
    }

    return matrix;
  }, [computeBoundingBox]);

  const addCorner = useCallback((position: Vector3) => {
    setCornerDetection(prev => {
      const newCorners = [...prev.corners, position.clone()];

      if (newCorners.length === 4) {
        // Validate and complete detection
        if (validateCorners(newCorners)) {
          const boundingBox = computeBoundingBox(newCorners);
          const surfaceArea = calculateSurfaceArea(newCorners);

          const newDetection: CornerDetection = {
            corners: newCorners,
            stage: 'completed',
            boundingBox,
            surfaceArea,
            perspectiveMatrix: computePerspectiveMatrix(newCorners),
          };

          // Notify parent components
          if (onCornerDetectionChange) {
            onCornerDetectionChange(newDetection);
          }

          if (onSurfaceDetected && boundingBox) {
            const surface: SurfaceDetection = {
              corners: {
                topLeft: newCorners[0],
                topRight: newCorners[1],
                bottomLeft: newCorners[2],
                bottomRight: newCorners[3],
              },
              boundingBox,
              perspectiveMatrix: computePerspectiveMatrix(newCorners),
              surfaceArea,
              normal: new Vector3(0, 0, 1), // Assume flat surface
            };
            onSurfaceDetected(surface);
          }

          return newDetection;
        } else {
          // Invalid corners, reset
          return {
            corners: [],
            stage: 'idle',
            boundingBox: null,
            surfaceArea: 0,
            perspectiveMatrix: null,
          };
        }
      } else {
        // Continue collecting corners
        return {
          ...prev,
          corners: newCorners,
          stage: 'detecting' as DetectionStage,
        };
      }
    });
  }, [validateCorners, calculateSurfaceArea, computeBoundingBox, computePerspectiveMatrix, onCornerDetectionChange, onSurfaceDetected]);

  const resetCornerDetection = useCallback(() => {
    setCornerDetection({
      corners: [],
      stage: 'idle',
      boundingBox: null,
      surfaceArea: 0,
      perspectiveMatrix: null,
    });
  }, []);

  // Hit test for corner detection
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

  // Update preview position every frame when detecting corners
  useFrame(() => {
    if (cornerDetection.stage !== 'completed' && previewRef.current) {
      previewRef.current.position.copy(hitTestPosition);
    }
  });

  // Handle tap to add corner
  useXRInputSourceEvent(
    'all',
    'select',
    () => {
      if (cornerDetection.stage !== 'completed' && previewRef.current) {
        addCorner(hitTestPosition);
      }
    },
    [cornerDetection.stage, addCorner]
  );

  const handleRotate = useCallback(() => {
    setRotation((prev) => new Euler(prev.x, prev.y + Math.PI / 4, prev.z));
  }, []);

  const handleScaleUp = useCallback(() => {
    setScale((prev) => Math.min(prev + 0.1, 2));
  }, []);

  const handleScaleDown = useCallback(() => {
    setScale((prev) => Math.max(prev - 0.1, 0.3));
  }, []);

  const handleReset = useCallback(() => {
    setIsPlaced(false);
    setScale(0.5);
    setRotation(new Euler(0, 0, 0));
    resetCornerDetection();
  }, [resetCornerDetection]);

  // Notify parent component about AR controls state
  useEffect(() => {
    if (onARControlsChange) {
      onARControlsChange({
        isPlaced,
        openAmount,
        onRotate: handleRotate,
        onScaleUp: handleScaleUp,
        onScaleDown: handleScaleDown,
        onReset: handleReset,
      });
    }
  }, [isPlaced, openAmount, handleRotate, handleScaleUp, handleScaleDown, handleReset, onARControlsChange]);

  // Notify parent about corner detection changes
  useEffect(() => {
    if (onCornerDetectionChange) {
      onCornerDetectionChange(cornerDetection);
    }
  }, [cornerDetection, onCornerDetectionChange]);


  return (
    <>
      {/* Normal 3D view */}
      <IfInSessionMode deny="immersive-ar">
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
      </IfInSessionMode>

      {/* AR Mode - corner detection workflow */}
      <IfInSessionMode allow="immersive-ar">
        {/* Corner detection phase */}
        {cornerDetection.stage !== 'completed' && (
          <group ref={previewRef}>
            <Text
              position={[0, 1.5, 0]}
              fontSize={0.1}
              color="#667eea"
              anchorX="center"
              anchorY="middle"
              outlineWidth={0.01}
              outlineColor="#ffffff"
            >
              {cornerDetection.corners.length === 0 && '👆 Tap top-left corner'}
              {cornerDetection.corners.length === 1 && '👆 Tap top-right corner'}
              {cornerDetection.corners.length === 2 && '👆 Tap bottom-left corner'}
              {cornerDetection.corners.length === 3 && '👆 Tap bottom-right corner'}
            </Text>

            {/* Visual placement reticle */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
              <ringGeometry args={[0.15, 0.2, 32]} />
              <meshBasicMaterial color="#667eea" transparent opacity={0.8} />
            </mesh>

            {/* Show detected corners */}
            {cornerDetection.corners.map((corner, index) => (
              <group key={index} position={corner}>
                <mesh position={[0, 0.02, 0]}>
                  <sphereGeometry args={[0.03, 16, 16]} />
                  <meshBasicMaterial color="#4ade80" />
                </mesh>
                <Text
                  position={[0, 0.1, 0]}
                  fontSize={0.05}
                  color="#4ade80"
                  anchorX="center"
                  anchorY="middle"
                >
                  {index + 1}
                </Text>
              </group>
            ))}

            {/* Draw connecting lines when we have corners */}
            {cornerDetection.corners.length >= 2 && (
              <Line
                points={cornerDetection.corners}
                color="#667eea"
                lineWidth={3}
              />
            )}
          </group>
        )}

        {/* Surface detected - show product preview */}
        {cornerDetection.stage === 'completed' && cornerDetection.boundingBox && (
          <group position={cornerDetection.boundingBox.center}>
            <Text
              position={[0, cornerDetection.boundingBox.max.y - cornerDetection.boundingBox.min.y + 0.5, 0]}
              fontSize={0.08}
              color="#4ade80"
              anchorX="center"
              anchorY="middle"
              outlineWidth={0.01}
              outlineColor="#ffffff"
            >
              ✓ Surface detected! Select a product below
            </Text>

            {/* Outline the detected surface */}
            <Line
              points={cornerDetection.corners}
              color="#4ade80"
              lineWidth={5}
            />

            {/* Show surface area */}
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

        {/* Legacy placed product (for backward compatibility) */}
        {isPlaced && cornerDetection.stage !== 'completed' && (
          <group 
            ref={groupRef} 
            position={[0, 0, -2]} // Default position for legacy mode
            rotation={rotation}
            scale={scale}
          >
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

            <Text
              position={[0, -2, 0]}
              fontSize={0.08}
              color="#4ade80"
              anchorX="center"
              anchorY="middle"
              outlineWidth={0.01}
              outlineColor="#ffffff"
            >
              ✓ Placed! Use controls to adjust
            </Text>
          </group>
        )}
      </IfInSessionMode>
    </>
  );
}

