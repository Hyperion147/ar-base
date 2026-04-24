import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { ContactShadows, OrbitControls } from '@react-three/drei';
import { Group } from 'three';
import type { ProductConfig } from '../../types';
import CurtainModel from '../../components/models/CurtainModel';
import BlindModel from '../../components/models/BlindModel';
import ShadeModel from '../../components/models/ShadeModel';
import DrapeModel from '../../components/models/DrapeModel';
import { Environment } from './Environment';

export interface ViewerHandle {
  captureSnapshot: () => string | null;
}

interface ViewerProps {
  config: ProductConfig;
}

function PreviewSet({ config }: { config: ProductConfig }) {
  const groupRef = useRef<Group>(null);

  useFrame((_state, delta) => {
    if (!groupRef.current || !config.autoRotate) return;
    groupRef.current.rotation.y += delta * 0.3;
  });

  return (
    <group ref={groupRef}>
      {config.previewMode === 'studio' && (
        <>
          <Environment scenePreset={config.scenePreset} />
          <ContactShadows position={[0, -2.65, -2.65]} opacity={0.4} scale={9} blur={1.8} far={4.5} />
        </>
      )}

      {config.selectedProduct === 'curtain' && (
        <CurtainModel
          style={config.curtainStyle}
          color={config.color}
          dimensions={config.dimensions}
          opacity={config.opacity}
          texture={config.texture}
          showMeasurements={config.showMeasurements}
          openAmount={config.openAmount}
          panelCount={config.panelCount}
        />
      )}

      {config.selectedProduct === 'blind' && (
        <BlindModel
          style={config.blindStyle}
          color={config.color}
          dimensions={config.dimensions}
          opacity={config.opacity}
          texture={config.texture}
          showMeasurements={config.showMeasurements}
          openAmount={config.openAmount}
        />
      )}

      {config.selectedProduct === 'shade' && (
        <ShadeModel
          style={config.shadeStyle}
          color={config.color}
          dimensions={config.dimensions}
          opacity={config.opacity}
          texture={config.texture}
          showMeasurements={config.showMeasurements}
          openAmount={config.openAmount}
        />
      )}

      {config.selectedProduct === 'drape' && (
        <DrapeModel
          style={config.drapeStyle}
          color={config.color}
          dimensions={config.dimensions}
          opacity={config.opacity}
          texture={config.texture}
          showMeasurements={config.showMeasurements}
          openAmount={config.openAmount}
          panelCount={config.panelCount}
        />
      )}
    </group>
  );
}

export const Viewer = forwardRef<ViewerHandle, ViewerProps>(({ config }, ref) => {
  const shellRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraStarted, setCameraStarted] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const rendererOptions = useMemo(
    () => ({
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true,
      powerPreference: config.qualityMode === 'quality' ? ('high-performance' as const) : ('default' as const),
    }),
    [config.qualityMode]
  );

  const stopCameraStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => {
    if (config.previewMode !== 'camera') {
      stopCameraStream();
      return;
    }

    if (!cameraStarted) {
      stopCameraStream();
      return;
    }

    let cancelled = false;

    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: false,
        });

        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => undefined);
        }
        setCameraReady(true);
        setCameraError(null);
      } catch (error) {
        setCameraError(error instanceof Error ? error.message : 'Camera permission unavailable');
      }
    }

    startCamera();

    return () => {
      cancelled = true;
      stopCameraStream();
      setCameraReady(false);
    };
  }, [cameraStarted, config.previewMode, stopCameraStream]);

  const captureSnapshot = useCallback(() => {
    const wrapper = shellRef.current;
    if (!wrapper) return null;

    const canvases = wrapper.getElementsByTagName('canvas');
    const renderCanvas = canvases[0];
    if (!renderCanvas) return null;

    const output = document.createElement('canvas');
    output.width = renderCanvas.width;
    output.height = renderCanvas.height;
    const context = output.getContext('2d');
    if (!context) return null;

    if (config.previewMode === 'camera' && videoRef.current && cameraReady) {
      context.drawImage(videoRef.current, 0, 0, output.width, output.height);
    } else {
      context.fillStyle = '#f2ece3';
      context.fillRect(0, 0, output.width, output.height);
    }

    context.drawImage(renderCanvas, 0, 0);
    return output.toDataURL('image/png');
  }, [cameraReady, config.previewMode]);

  useImperativeHandle(
    ref,
    () => ({
      captureSnapshot,
    }),
    [captureSnapshot]
  );

  return (
    <div ref={shellRef} className="relative h-full min-h-[360px] overflow-hidden rounded-[24px] border border-white/60 bg-[#d6c8b4] sm:min-h-[440px] sm:rounded-[28px] lg:min-h-[520px] lg:rounded-[32px]">
      {config.previewMode === 'camera' && cameraStarted && (
        <div className="absolute inset-0 bg-[#120f0b]">
          <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover" />
          {!cameraReady && !cameraError && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/45 px-6 text-center text-xs uppercase tracking-[0.24em] text-white/80 sm:text-sm sm:tracking-[0.28em]">
              Warming up camera
            </div>
          )}
          {cameraError && (
            <div className="absolute inset-x-3 top-3 rounded-[18px] border border-amber-300/60 bg-amber-100/90 px-4 py-3 text-sm text-amber-950 sm:inset-x-6 sm:top-6 sm:rounded-full">
              Camera preview is unavailable. You can keep designing in studio mode.
            </div>
          )}
        </div>
      )}

      <div className="absolute inset-0">
        <Canvas camera={{ position: [0, 0.3, 7], fov: 35 }} dpr={[1, 2]} shadows gl={rendererOptions}>
          <ambientLight intensity={config.scenePreset === 'midnight' ? 0.8 : 1.05} />
          <directionalLight position={[4, 5, 4]} intensity={1.6} castShadow />
          <directionalLight position={[-4, 2, 2]} intensity={config.scenePreset === 'sunset' ? 1.2 : 0.75} color={config.scenePreset === 'sunset' ? '#ffcf9f' : '#f5f1ea'} />
          <PreviewSet config={config} />
          <OrbitControls
            enablePan={false}
            minDistance={5}
            maxDistance={10}
            minPolarAngle={Math.PI / 3.2}
            maxPolarAngle={Math.PI / 1.9}
          />
        </Canvas>
      </div>

      {!(config.previewMode === 'camera' && cameraStarted) && (
        <div className="pointer-events-none absolute inset-x-0 top-0 flex flex-col gap-3 p-3 sm:flex-row sm:items-start sm:justify-between sm:p-6">
          <div className="max-w-sm rounded-[20px] border border-white/55 bg-white/72 px-4 py-3 shadow-[0_20px_70px_rgba(38,24,16,0.15)] backdrop-blur-xl sm:rounded-[24px] sm:px-5 sm:py-4">
          <p className="text-[0.65rem] uppercase tracking-[0.28em] text-[#6f5848]">Live Preview</p>
          <h2 className="mt-2 text-xl font-semibold text-[#1d140f] sm:text-2xl">
            {config.previewMode === 'camera' ? 'Camera overlay preview' : 'Studio staging preview'}
          </h2>
          <p className="mt-2 text-xs leading-5 text-[#5f4c40] sm:text-sm sm:leading-6">
            Orbit the room, fine-tune the fabric, then export a spec sheet or a preview image.
          </p>
            {config.previewMode === 'camera' && (
              <div className="pointer-events-auto mt-4">
                <button
                  onClick={() => {
                    setCameraStarted(true);
                    setCameraError(null);
                  }}
                  className="rounded-full bg-[#1f1712] px-5 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-[#36261d]"
                >
                  Open camera
                </button>
              </div>
            )}
          </div>

          <div className="self-start rounded-[20px] border border-white/55 bg-[#1f1712]/80 px-4 py-3 text-left text-white shadow-[0_20px_70px_rgba(25,12,5,0.18)] backdrop-blur-xl sm:rounded-[24px] sm:px-5 sm:py-4 sm:text-right">
            <p className="text-[0.65rem] uppercase tracking-[0.28em] text-white/60">Mode</p>
            <p className="mt-2 text-base font-semibold capitalize sm:text-lg">{config.previewMode}</p>
            <p className="mt-1 text-xs uppercase tracking-[0.22em] text-white/60">{config.scenePreset}</p>
          </div>
        </div>
      )}
    </div>
  );
});
