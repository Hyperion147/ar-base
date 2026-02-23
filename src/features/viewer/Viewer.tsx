import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment as DreiEnvironment, ContactShadows } from '@react-three/drei';
import { XR, createXRStore, IfInSessionMode } from '@react-three/xr';
import { useState, useEffect, useCallback, useRef, forwardRef, useImperativeHandle } from 'react';
import { ARExperience, type ARControlsState } from '../../components/ARExperience';
import { ARInstructions } from '../../components/ARInstructions';
import { ARControls } from '../../components/ARControls';
import { Environment } from './Environment';
import type { ProductConfig } from '../../types';
import { MdRefresh, MdCameraAlt } from 'react-icons/md';

interface ViewerProps {
  config: ProductConfig;
  onUpdateOpenness: (amount: number) => void;
  isViewLocked: boolean;
}


// Create XR store outside component to persist across renders
const store = createXRStore({
  hitTest: true,
  domOverlay: true,
});

/**
 * Custom hook to handle horizontal drag for controlling openness.
 * Returns event handlers for pointer down, move, and up.
 */
function usePointerDrag(
  onUpdate: (deltaX: number, deltaY: number) => void,
  enabled: boolean = true
) {
  const isDragging = useRef(false);
  const lastX = useRef(0);
  const lastY = useRef(0);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (!enabled) return;
    isDragging.current = true;
    lastX.current = e.clientX;
    lastY.current = e.clientY;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [enabled]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current || !enabled) return;

    const deltaX = e.clientX - lastX.current;
    const deltaY = e.clientY - lastY.current;
    lastX.current = e.clientX;
    lastY.current = e.clientY;

    // Normalize deltas by screen dimensions for consistent sensitivity
    const normalizedDeltaX = deltaX / window.innerWidth;
    const normalizedDeltaY = deltaY / window.innerHeight;
    onUpdate(normalizedDeltaX, normalizedDeltaY);
  }, [onUpdate, enabled]);

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    isDragging.current = false;
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  }, []);

  return { onPointerDown, onPointerMove, onPointerUp };
}

export const Viewer = forwardRef<{ enterAR: () => void }, ViewerProps>(({ config, onUpdateOpenness, isViewLocked }, ref) => {

  const { selectedProduct } = config;
  const [isARSupported, setIsARSupported] = useState(true);
  const [showARInstructions, setShowARInstructions] = useState(false);
  const [isInAR, setIsInAR] = useState(false);
  const [arControls, setARControls] = useState<ARControlsState | null>(null);

  useImperativeHandle(ref, () => ({
    enterAR: handleEnterAR
  }));

  // Check AR support on mount
  useEffect(() => {
    if (navigator.xr) {
      navigator.xr.isSessionSupported('immersive-ar').then((supported) => {
        setIsARSupported(supported);
      }).catch(() => {
        setIsARSupported(false);
      });
    } else {
      setIsARSupported(false);
    }
  }, []);

  // Monitor XR session state
  useEffect(() => {
    const unsubscribe = store.subscribe((state) => {
      const isActive = state.session !== null;
      setIsInAR(isActive);
      setShowARInstructions(isActive);
    });
    return unsubscribe;
  }, []);

  const handleEnterAR = async () => {
    try {
      await store.enterAR();
    } catch (error) {
      console.error('AR not supported:', error);
      setIsARSupported(false);
      alert('🚫 AR Not Available\n\nPlease use:\n• iPhone/iPad with iOS 13+ (Safari)\n• Android phone with ARCore (Chrome)');
    }
  };

  const handleExitAR = () => {
    setShowARInstructions(false);
  };

  const handleARControlsChange = useCallback((controls: ARControlsState) => {
    setARControls(controls);
  }, []);

  const handleOpennessDrag = useCallback((deltaX: number, deltaY: number) => {
    const isVerticalControl = config.selectedProduct === 'blind' || config.selectedProduct === 'shade';

    // Vertical products often open bottom-up (roller) or top-down, but drag down usually means "close"
    // For blinds/shades, dragging DOWN (positive deltaY) usually means increasing openness (if 1 is open)
    // Actually, usually 1 is fully open (up) and 0 is fully closed (down)
    // So dragging DOWN (-deltaY) decreases openness.
    const delta = isVerticalControl ? -deltaY * 2.5 : deltaX * 2;

    onUpdateOpenness(Math.max(0, Math.min(1, config.openAmount + delta)));
  }, [config.selectedProduct, config.openAmount, onUpdateOpenness]);

  const { onPointerDown, onPointerMove, onPointerUp } = usePointerDrag(handleOpennessDrag, true);

  return (
    <div
      className="flex-1 relative bg-gray-50 touch-none"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
    >
      <Canvas
        camera={{ position: [0, 0, 6], fov: 45 }}
        shadows
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance"
        }}
      >
        <XR store={store}>
          <color attach="background" args={['#fafafa']} />
          <ambientLight intensity={0.6} />
          <directionalLight
            position={[5, 10, 5]}
            intensity={1.2}
            castShadow
            shadow-mapSize={[2048, 2048]}
          />
          <spotLight position={[-5, 5, 2]} intensity={0.5} angle={0.3} penumbra={1} />
          <DreiEnvironment preset="apartment" />

          <IfInSessionMode deny="immersive-ar">
            <Environment />
          </IfInSessionMode>

          <ARExperience config={config} onARControlsChange={handleARControlsChange} />

          <IfInSessionMode deny="immersive-ar">
            <ContactShadows
              position={[0, -2, 0]}
              opacity={0.3}
              scale={12}
              blur={2.5}
              far={5}
            />

            <OrbitControls
              enablePan={!isViewLocked}
              enableZoom={true}
              enableRotate={!isViewLocked}
              minDistance={3}
              maxDistance={12}
              makeDefault
            />
          </IfInSessionMode>
        </XR>
      </Canvas>

      {/* AR Instructions Overlay */}
      {showARInstructions && (
        <ARInstructions onClose={handleExitAR} isVisible={isInAR} />
      )}

      {/* AR Controls */}
      {arControls && (
        <ARControls
          isPlaced={arControls.isPlaced}
          isInAR={isInAR}
          openAmount={config.openAmount}
          onRotate={arControls.onRotate}
          onScaleUp={arControls.onScaleUp}
          onScaleDown={arControls.onScaleDown}
          onReset={arControls.onReset}
          onUpdateOpenness={onUpdateOpenness}
        />

      )}

      {/* Toolbar */}
      {selectedProduct && !isInAR && (
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 
                      bg-white/90 backdrop-blur-xl px-2 py-2 rounded-none border border-gray-100
                      shadow-[0_20px_50px_rgba(0,0,0,0.1)] flex items-center gap-1">
          <ToolbarButton icon={<MdRefresh />} title="Reset View" />
          <div className="w-px h-6 bg-gray-200 mx-2" />
          <button
            onClick={handleEnterAR}
            className="px-6 py-3 bg-gray-900 text-white 
                           rounded-none font-black text-[10px] uppercase tracking-[0.2em] flex items-center gap-3
                           hover:bg-[#667eea] transition-all duration-300 disabled:opacity-50"
            disabled={!isARSupported}
          >
            <MdCameraAlt className="text-lg" />
            {isARSupported ? 'Initiate AR' : 'AR Unavailable'}
          </button>
        </div>
      )}
    </div>
  );
});

const ToolbarButton = ({ icon, title, onClick, active, label }: { icon: React.ReactNode; title: string; onClick?: () => void; active?: boolean; label?: string }) => (
  <button
    onClick={onClick}
    className={`p-3 transition-all duration-300 flex items-center gap-2 ${active ? 'bg-blue-50 text-blue-600' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-50'}`}
    title={title}
  >
    <span className="text-xl">{icon}</span>
    {label && <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>}
  </button>
);

