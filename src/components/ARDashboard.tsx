import { useState, useCallback, useEffect, useRef } from 'react';
import { IconSidebar } from '../features/sidebar/IconSidebar';
import { ContentPanel } from '../features/panel/ContentPanel';
import { Viewer } from '../features/viewer/Viewer';
import { useProductConfig } from '../hooks/useProductConfig';
import type { ActiveTab } from '../types';
import { MdCheckCircle, MdInfo } from 'react-icons/md';

export default function ARDashboard() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('products');
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' } | null>(null);
  const viewerRef = useRef<{ enterAR: () => void }>(null);

  const {
    config,
    updateProduct,
    updateCurtainStyle,
    updateBlindStyle,
    updateShadeStyle,
    updateDrapeStyle,
    updateColor,
    updateDimensions,
    updateMountType,
    updateOpacity,
    updateTexture,
    toggleMeasurements,
    updateOpenness,
    updatePanelCount,
    toggleViewLock,
  } = useProductConfig();


  const showNotification = useCallback((message: string, type: 'success' | 'info' = 'success') => {
    setNotification({ message, type });
  }, []);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const handleClosePanel = () => setActiveTab(null);

  const handleUpdateProduct = (product: any) => {
    updateProduct(product);
    const names = {
      curtain: 'Curtains',
      blind: 'Blinds',
      shade: 'Shades',
      drape: 'Drapes'
    };
    showNotification(`Switched to ${names[product as keyof typeof names] || 'Product'}`, 'info');
  };

  const handleEnterAR = () => {
    viewerRef.current?.enterAR();
  };

  return (
    <div className="flex h-screen w-screen bg-gray-50 relative overflow-hidden font-sans selection:bg-indigo-100 selection:text-indigo-900">
      <IconSidebar activeTab={activeTab} onTabChange={setActiveTab} />

      <ContentPanel
        activeTab={activeTab}
        config={config}
        onClose={handleClosePanel}
        onUpdateProduct={handleUpdateProduct}
        onUpdateCurtainStyle={updateCurtainStyle}
        onUpdateBlindStyle={updateBlindStyle}
        onUpdateShadeStyle={updateShadeStyle}
        onUpdateDrapeStyle={updateDrapeStyle}
        onUpdateColor={updateColor}
        onUpdateDimensions={updateDimensions}
        onUpdateMountType={updateMountType}
        onUpdateOpacity={updateOpacity}
        onUpdateTexture={updateTexture}
        onToggleMeasurements={toggleMeasurements}
        onEnterAR={handleEnterAR}
        onUpdateOpenness={updateOpenness}
        onUpdatePanelCount={updatePanelCount}
        onToggleViewLock={toggleViewLock}
      />


      <Viewer
        ref={viewerRef}
        config={config}
        onUpdateOpenness={updateOpenness}
        isViewLocked={config.isViewLocked}
      />


      {/* Notifications */}
      {notification && (
        <div className="fixed bottom-10 right-10 z-[500] animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className="bg-gray-900 text-white px-6 py-4 rounded-none shadow-2xl flex items-center gap-3 border-l-4 border-[#667eea]">
            {notification.type === 'success' ? (
              <MdCheckCircle className="text-[#667eea] text-xl" />
            ) : (
              <MdInfo className="text-blue-400 text-xl" />
            )}
            <span className="text-sm font-bold uppercase tracking-widest">{notification.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}


