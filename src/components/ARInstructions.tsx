import { MdClose, MdAdsClick, MdCheckCircle } from 'react-icons/md';
import type { CornerDetection } from '../types';

interface ARInstructionsProps {
  onClose: () => void;
  isVisible: boolean;
  cornerDetection?: CornerDetection;
}

export function ARInstructions({ onClose, isVisible, cornerDetection }: ARInstructionsProps) {
  if (!isVisible) return null;

  const getInstructions = () => {
    if (!cornerDetection || cornerDetection.stage === 'idle') {
      return {
        title: 'Window Detection',
        subtitle: 'Point at a window frame',
        instruction: 'Tap the top-left corner to start',
        icon: MdAdsClick,
      };
    }

    if (cornerDetection.stage === 'detecting') {
      const steps = [
        'Tap the top-left corner',
        'Tap the top-right corner', 
        'Tap the bottom-left corner',
        'Tap the bottom-right corner'
      ];
      
      return {
        title: 'Mark Window Corners',
        subtitle: `Step ${cornerDetection.corners.length + 1} of 4`,
        instruction: steps[cornerDetection.corners.length] || 'Complete!',
        icon: MdAdsClick,
      };
    }

    if (cornerDetection.stage === 'completed') {
      return {
        title: 'Surface Detected!',
        subtitle: `Area: ${(cornerDetection.surfaceArea * 10000).toFixed(1)} cm²`,
        instruction: 'Select a product to preview',
        icon: MdCheckCircle,
      };
    }

    return {
      title: 'Setup Guide',
      subtitle: 'Point at a wall',
      instruction: 'Tap anywhere to place product',
      icon: MdAdsClick,
    };
  };

  const instructions = getInstructions();

  return (
    <div className="fixed inset-0 pointer-events-none z-[400]">
      {/* Top instruction banner - moved to right to avoid overlap with XR buttons */}
      <div className="absolute top-8 right-8 pointer-events-auto animate-in slide-in-from-right-10 duration-500">
        <div className={`bg-white/95 backdrop-blur-md text-gray-900 px-6 py-5 rounded-none 
                      shadow-2xl max-w-xs border-l-4 ${
                        cornerDetection?.stage === 'completed' ? 'border-green-500' : 'border-[#667eea]'
                      }`}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <instructions.icon className={`${
                  cornerDetection?.stage === 'completed' ? 'text-green-500' : 'text-[#667eea]'
                } text-xl`} />
                <p className="text-sm font-bold uppercase tracking-widest italic">{instructions.title}</p>
              </div>
              <p className="text-base font-bold text-gray-900 mb-1">{instructions.subtitle}</p>
              <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
                <instructions.icon className="text-gray-400" />
                <span>{instructions.instruction}</span>
              </div>
              
              {/* Progress indicator for corner detection */}
              {cornerDetection?.stage === 'detecting' && (
                <div className="mt-3 flex gap-1">
                  {[0, 1, 2, 3].map((index) => (
                    <div
                      key={index}
                      className={`w-2 h-2 rounded-full ${
                        index < cornerDetection.corners.length
                          ? 'bg-green-500'
                          : 'bg-gray-300'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
            <button 
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-none transition-colors border border-gray-200"
            >
              <MdClose className="text-xl text-gray-400" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

