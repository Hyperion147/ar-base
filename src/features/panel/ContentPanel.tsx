import { TABS } from '../../constants/tabs';
import type { ActiveTab } from '../../types';
import { ProductsTab } from '../tabs/ProductsTab';
import { StylesTab } from '../tabs/StylesTab';
import { DimensionsTab } from '../tabs/DimensionsTab';
import { ColorsTab } from '../tabs/ColorsTab';
import { SettingsTab } from '../tabs/SettingsTab';
import type { ProductConfig } from '../../types';
import { MdClose } from 'react-icons/md';

interface ContentPanelProps {
  activeTab: ActiveTab;
  config: ProductConfig;
  onClose: () => void;
  onUpdateProduct: (product: ProductConfig['selectedProduct']) => void;
  onUpdateCurtainStyle: (style: ProductConfig['curtainStyle']) => void;
  onUpdateBlindStyle: (style: ProductConfig['blindStyle']) => void;
  onUpdateShadeStyle: (style: ProductConfig['shadeStyle']) => void;
  onUpdateDrapeStyle: (style: ProductConfig['drapeStyle']) => void;
  onUpdateColor: (color: string) => void;
  onUpdateDimensions: (dimensions: Partial<ProductConfig['dimensions']>) => void;
  onUpdateMountType: (mountType: ProductConfig['mountType']) => void;
  onUpdateOpacity: (opacity: number) => void;
  onUpdateTexture: (texture: ProductConfig['texture']) => void;
  onToggleMeasurements: () => void;
  onEnterAR: () => void;
  onUpdateOpenness: (amount: number) => void;
  onUpdatePanelCount: (count: number) => void;
  onToggleViewLock: () => void;
}


export const ContentPanel = ({
  activeTab,
  config,
  onClose,
  onUpdateProduct,
  onUpdateCurtainStyle,
  onUpdateBlindStyle,
  onUpdateShadeStyle,
  onUpdateDrapeStyle,
  onUpdateColor,
  onUpdateDimensions,
  onUpdateMountType,
  onUpdateOpacity,
  onUpdateTexture,
  onToggleMeasurements,
  onEnterAR,
  onUpdateOpenness,
  onUpdatePanelCount,
  onToggleViewLock,
}: ContentPanelProps) => {

  const currentTab = TABS.find(t => t.id === activeTab);

  return (
    <div
      className={`
        w-[350px] bg-white border-r border-gray-200 flex flex-col
        transition-all duration-300 ease-in-out z-[100] shadow-lg
        ${activeTab ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0 pointer-events-none'}
      `}
    >
      {/* Header */}
      <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-center bg-gray-50">
        <h2 className="text-xl font-semibold text-gray-900">{currentTab?.label}</h2>
        <button
          className="w-8 h-8 rounded-none hover:bg-gray-200 flex items-center justify-center transition-colors"
          onClick={onClose}
          aria-label="Close panel"
        >
          <MdClose className="text-2xl text-gray-600" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
        {activeTab === 'products' && (
          <ProductsTab
            selectedProduct={config.selectedProduct}
            onSelectProduct={onUpdateProduct}
            onEnterAR={onEnterAR}
          />
        )}

        {activeTab === 'styles' && (
          <StylesTab
            selectedProduct={config.selectedProduct}
            curtainStyle={config.curtainStyle}
            blindStyle={config.blindStyle}
            shadeStyle={config.shadeStyle}
            drapeStyle={config.drapeStyle}
            opacity={config.opacity}
            texture={config.texture}
            onUpdateCurtainStyle={onUpdateCurtainStyle}
            onUpdateBlindStyle={onUpdateBlindStyle}
            onUpdateShadeStyle={onUpdateShadeStyle}
            onUpdateDrapeStyle={onUpdateDrapeStyle}
            onUpdateOpacity={onUpdateOpacity}
            onUpdateTexture={onUpdateTexture}
            openAmount={config.openAmount}
            onUpdateOpenness={onUpdateOpenness}
            panelCount={config.panelCount}
            onUpdatePanelCount={onUpdatePanelCount}
          />

        )}

        {activeTab === 'dimensions' && (
          <DimensionsTab
            selectedProduct={config.selectedProduct}
            dimensions={config.dimensions}
            mountType={config.mountType}
            curtainStyle={config.curtainStyle}
            blindStyle={config.blindStyle}
            shadeStyle={config.shadeStyle}
            drapeStyle={config.drapeStyle}
            onUpdateDimensions={onUpdateDimensions}
            onUpdateMountType={onUpdateMountType}
          />
        )}

        {activeTab === 'colors' && (
          <ColorsTab
            selectedProduct={config.selectedProduct}
            color={config.color}
            onUpdateColor={onUpdateColor}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsTab
            showMeasurements={config.showMeasurements}
            onToggleMeasurements={onToggleMeasurements}
            isViewLocked={config.isViewLocked}
            onToggleViewLock={onToggleViewLock}
          />
        )}
      </div>
    </div>
  );
};

