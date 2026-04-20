import { MdRotateRight, MdZoomIn, MdZoomOut, MdRefresh, MdSwapHoriz, MdUndo, MdCheckCircle } from 'react-icons/md';
import type { CornerDetection, ProductType } from '../types';

interface ARControlsProps {
  isPlaced: boolean;
  isInAR: boolean;
  openAmount: number;
  cornerDetection?: CornerDetection;
  selectedProduct?: ProductType;
  onRotate: () => void;
  onScaleUp: () => void;
  onScaleDown: () => void;
  onReset: () => void;
  onUpdateOpenness: (amount: number) => void;
  onUndoLastCorner?: () => void;
  onSelectProduct?: (product: ProductType) => void;
}

export function ARControls({ 
  isPlaced, 
  isInAR, 
  openAmount,
  cornerDetection,
  selectedProduct,
  onRotate, 
  onScaleUp, 
  onScaleDown, 
  onReset,
  onUpdateOpenness,
  onUndoLastCorner,
  onSelectProduct
}: ARControlsProps) {
  // Show corner detection controls during detection phase
  if (isInAR && cornerDetection && cornerDetection.stage !== 'completed') {
    return (
      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[300] pointer-events-auto">
        <div className="bg-white/90 backdrop-blur-2xl px-6 py-4 rounded-none shadow-[0_20px_60px_rgba(0,0,0,0.3)] 
                      flex items-center gap-4 border border-white/20">
          
          {/* Corner Counter */}
          <div className="flex flex-col items-center gap-2">
            <div className="text-sm font-bold text-gray-800">
              Tap Corners: {cornerDetection.corners.length}/4
            </div>
            <div className="flex gap-1">
              {[0, 1, 2, 3].map((index) => (
                <div
                  key={index}
                  className={`w-3 h-3 rounded-full border-2 ${
                    index < cornerDetection.corners.length
                      ? 'bg-green-500 border-green-500'
                      : 'bg-gray-200 border-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Undo Button */}
          {cornerDetection.corners.length > 0 && onUndoLastCorner && (
            <>
              <div className="w-px h-10 bg-gray-200/50" />
              <button 
                onClick={onUndoLastCorner}
                className="p-3 bg-orange-50 hover:bg-orange-500 hover:text-white text-orange-600 rounded-none transition-all duration-300 border border-orange-100 flex flex-col items-center gap-1"
                title="Undo Last Corner"
              >
                <MdUndo className="text-xl" />
                <span className="text-[8px] font-black uppercase tracking-tighter">Undo</span>
              </button>
            </>
          )}

          {/* Reset Button */}
          <div className="w-px h-10 bg-gray-200/50" />
          <button 
            onClick={onReset}
            className="p-3 bg-red-50/80 hover:bg-red-500 hover:text-white text-red-600 rounded-none transition-all duration-300 border border-red-100 flex flex-col items-center gap-1"
            title="Start Over"
          >
            <MdRefresh className="text-xl" />
            <span className="text-[8px] font-black uppercase tracking-tighter">Reset</span>
          </button>
        </div>
      </div>
    );
  }

  // Show product selection when surface is detected
  if (isInAR && cornerDetection?.stage === 'completed' && onSelectProduct) {
    const products: { id: ProductType; name: string; emoji: string }[] = [
      { id: 'curtain', name: 'Curtains', emoji: '🪟' },
      { id: 'blind', name: 'Blinds', emoji: '🪟' },
      { id: 'shade', name: 'Shades', emoji: '🪟' },
      { id: 'drape', name: 'Drapes', emoji: '🪟' },
    ];

    return (
      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[300] pointer-events-auto">
        <div className="bg-white/90 backdrop-blur-2xl px-6 py-4 rounded-none shadow-[0_20px_60px_rgba(0,0,0,0.3)] 
                      border border-white/20">
          
          <div className="text-center mb-4">
            <div className="flex items-center justify-center gap-2 mb-2">
              <MdCheckCircle className="text-green-500 text-xl" />
              <span className="text-sm font-bold text-gray-800">Surface Detected!</span>
            </div>
            <p className="text-xs text-gray-600">Select a product to preview</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {products.map((product) => (
              <button
                key={product.id}
                onClick={() => onSelectProduct(product.id)}
                className={`p-4 rounded-none transition-all duration-300 border flex flex-col items-center gap-2 ${
                  selectedProduct === product.id
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white/50 hover:bg-white text-gray-800 border-gray-100'
                }`}
                title={product.name}
              >
                <span className="text-2xl">{product.emoji}</span>
                <span className="text-xs font-bold uppercase tracking-tighter">{product.name}</span>
              </button>
            ))}
          </div>

          <div className="mt-4 pt-3 border-t border-gray-200">
            <button 
              onClick={onReset}
              className="w-full p-3 bg-gray-50 hover:bg-gray-200 text-gray-700 rounded-none transition-all duration-300 border border-gray-200 text-sm font-bold"
              title="Start Over"
            >
              Start Over
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Original placement controls (when product is placed)
  if (!isPlaced || !isInAR) return null;

  const handleToggleOpen = () => {
    // Basic toggle if we're in AR and don't want a full slider
    onUpdateOpenness(openAmount > 0.5 ? 0 : 1);
  };

  return (
    <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[300] pointer-events-auto">
      <div className="bg-white/90 backdrop-blur-2xl px-4 py-3 rounded-none shadow-[0_20px_60px_rgba(0,0,0,0.3)] 
                    flex items-center gap-3 border border-white/20">
        
        {/* Toggle Open/Close */}
        <button 
          onClick={handleToggleOpen}
          className={`p-4 rounded-none transition-all duration-300 flex flex-col items-center gap-1
                     ${openAmount > 0.5 ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'}`}
          title={openAmount > 0.5 ? 'Open' : 'Close'}
        >
          <MdSwapHoriz className="text-2xl" />
          <span className="text-[8px] font-black uppercase tracking-tighter">
            {openAmount > 0.5 ? 'Open' : 'Close'}
          </span>
        </button>

        <div className="w-px h-10 bg-gray-200/50 mx-1" />

        <div className="grid grid-cols-2 gap-2">
          <button 
            onClick={onRotate}
            className="p-4 bg-white/50 hover:bg-white text-gray-800 rounded-none transition-all duration-300 border border-gray-100 flex flex-col items-center gap-1"
            title="Rotate"
          >
            <MdRotateRight className="text-2xl" />
            <span className="text-[8px] font-black uppercase tracking-tighter">Rotate</span>
          </button>
          
          <button 
            onClick={onReset}
            className="p-4 bg-red-50/80 hover:bg-red-500 hover:text-white text-red-600 rounded-none transition-all duration-300 border border-red-100 flex flex-col items-center gap-1"
            title="Relocate"
          >
            <MdRefresh className="text-2xl" />
            <span className="text-[8px] font-black uppercase tracking-tighter">Relocate</span>
          </button>
        </div>

        <div className="w-px h-10 bg-gray-200/50 mx-1" />

        <div className="flex flex-col gap-2">
          <button 
            onClick={onScaleUp}
            className="p-3 bg-white/50 hover:bg-white text-gray-800 rounded-none transition-all duration-300 border border-gray-100"
            title="Bigger"
          >
            <MdZoomIn className="text-xl" />
          </button>
          
          <button 
            onClick={onScaleDown}
            className="p-3 bg-white/50 hover:bg-white text-gray-800 rounded-none transition-all duration-300 border border-gray-100"
            title="Smaller"
          >
            <MdZoomOut className="text-xl" />
          </button>
        </div>
      </div>
    </div>
  );
}

