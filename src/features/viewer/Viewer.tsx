import React, { useState, useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import { Canvas } from '@react-three/fiber';
import { XR, createXRStore } from '@react-three/xr';
import { ARExperience } from '../../components/ARExperience';
import type { ProductConfig } from '../../types';

// Create XR store outside component to persist across renders
const store = createXRStore({
  hitTest: true,
  domOverlay: true,
});

interface ViewerProps {
  config: ProductConfig;
  onUpdateOpenness: (amount: number) => void;
  onSelectProduct?: (product: ProductConfig['selectedProduct']) => void;
}

export const Viewer = forwardRef<{ enterAR: () => void }, ViewerProps>(({ config, onUpdateOpenness: _onUpdateOpenness, onSelectProduct: _onSelectProduct }, ref) => {
  // Camera functionality
  const [viewMode, setViewMode] = useState<'camera' | 'captured' | '3d'>('camera');
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Initialize camera
  const initializeCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
    }
  }, []);

  // Capture photo
  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageDataUrl = canvas.toDataURL('image/jpeg', 0.8);
    setCapturedImage(imageDataUrl);
    setViewMode('captured');
  }, []);

  // Handle image tap
  const handleImageTap = useCallback((_event: React.MouseEvent<HTMLDivElement>) => {
    // After tap, switch to 3D view
    setViewMode('3d');
  }, []);

  // Reset camera
  const resetCamera = useCallback(() => {
    setCapturedImage(null);
    setViewMode('camera');
  }, []);

  // Handle AR controls change
  const handleARControlsChange = useCallback((_controls: any) => {
    // Handle AR controls if needed
  }, []);

  // Expose enterAR method via ref
  useImperativeHandle(ref, () => ({
    enterAR: () => setViewMode('3d')
  }), []);

  // Initialize camera on mount
  useEffect(() => {
    if (viewMode === 'camera') {
      initializeCamera();
    }
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [viewMode, initializeCamera, cameraStream]);

  return (
    <div className="flex-1 relative bg-gray-50">
      {/* Camera View - Default */}
      {viewMode === 'camera' && (
        <div className="w-full h-full relative bg-black">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          <canvas ref={canvasRef} className="hidden" />
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
            <button
              onClick={capturePhoto}
              className="w-20 h-20 bg-white rounded-full border-4 border-gray-300 flex items-center justify-center shadow-lg hover:bg-gray-50 transition-colors"
            >
              📷
            </button>
          </div>
        </div>
      )}

      {/* Captured Image View */}
      {viewMode === 'captured' && capturedImage && (
        <div className="w-full h-full relative bg-black" onClick={handleImageTap}>
          <img
            src={capturedImage}
            alt="Captured"
            className="w-full h-full object-contain"
          />
          <div className="absolute top-6 right-6">
            <button
              onClick={resetCamera}
              className="px-4 py-2 bg-white/90 backdrop-blur rounded-lg text-gray-800 font-medium"
            >
              Retake
            </button>
          </div>
        </div>
      )}

      {/* 3D View */}
      {viewMode === '3d' && (
        <Canvas 
          camera={{ position: [0, 0, 6], fov: 45 }}
          shadows
          gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        >
          <XR store={store}>
            <color attach="background" args={['#fafafa']} />
            <ambientLight intensity={0.6} />
            <directionalLight position={[5, 10, 5]} intensity={1.2} castShadow />
            <ARExperience config={config} onARControlsChange={handleARControlsChange} />
          </XR>
        </Canvas>
      )}
    </div>
  );
});
