import { useEffect, useState } from 'react';
import type {
  BlindStyle,
  CurtainStyle,
  DrapeStyle,
  MountType,
  PreviewMode,
  ProductConfig,
  ProductType,
  QualityMode,
  ScenePreset,
  ShadeStyle,
  TextureType,
} from '../types';

const STORAGE_KEY = 'ar-base:config:v2';

const DEFAULT_CONFIG: ProductConfig = {
  selectedProduct: 'curtain',
  curtainStyle: 'sheer',
  blindStyle: 'roller',
  shadeStyle: 'honeycomb',
  drapeStyle: 'classic',
  color: '#d9d2c3',
  dimensions: { width: 180, height: 220, drop: 6 },
  mountType: 'outside',
  opacity: 0.7,
  texture: 'fabric',
  showMeasurements: false,
  isOpen: true,
  openAmount: 0.72,
  panelCount: 2,
  previewMode: 'studio',
  scenePreset: 'gallery',
  qualityMode: 'quality',
  autoRotate: false,
};

function mergeConfig(value: Partial<ProductConfig> | null | undefined): ProductConfig {
  if (!value) return DEFAULT_CONFIG;

  return {
    ...DEFAULT_CONFIG,
    ...value,
    dimensions: {
      ...DEFAULT_CONFIG.dimensions,
      ...value.dimensions,
    },
  };
}

function parseSharedConfig() {
  if (typeof window === 'undefined') return null;

  const searchParams = new URLSearchParams(window.location.search);
  const shared = searchParams.get('design');

  if (!shared) return null;

  try {
    const parsed = JSON.parse(decodeURIComponent(shared)) as Partial<ProductConfig>;
    return mergeConfig(parsed);
  } catch {
    return null;
  }
}

function loadInitialConfig() {
  if (typeof window === 'undefined') return DEFAULT_CONFIG;

  const sharedConfig = parseSharedConfig();
  if (sharedConfig) return sharedConfig;

  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (!stored) return DEFAULT_CONFIG;

  try {
    return mergeConfig(JSON.parse(stored) as Partial<ProductConfig>);
  } catch {
    return DEFAULT_CONFIG;
  }
}

export const useProductConfig = () => {
  const [config, setConfig] = useState<ProductConfig>(() => loadInitialConfig());

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  }, [config]);

  const replaceConfig = (nextConfig: ProductConfig) => {
    setConfig(mergeConfig(nextConfig));
  };

  const resetConfig = () => {
    setConfig(DEFAULT_CONFIG);
  };

  const updateProduct = (product: ProductType) => {
    setConfig((prev) => ({ ...prev, selectedProduct: product }));
  };

  const updateCurtainStyle = (style: CurtainStyle) => {
    setConfig((prev) => ({ ...prev, curtainStyle: style }));
  };

  const updateBlindStyle = (style: BlindStyle) => {
    setConfig((prev) => ({ ...prev, blindStyle: style }));
  };

  const updateShadeStyle = (style: ShadeStyle) => {
    setConfig((prev) => ({ ...prev, shadeStyle: style }));
  };

  const updateDrapeStyle = (style: DrapeStyle) => {
    setConfig((prev) => ({ ...prev, drapeStyle: style }));
  };

  const updateColor = (color: string) => {
    setConfig((prev) => ({ ...prev, color }));
  };

  const updateDimensions = (dimensions: Partial<ProductConfig['dimensions']>) => {
    setConfig((prev) => ({
      ...prev,
      dimensions: { ...prev.dimensions, ...dimensions },
    }));
  };

  const updateMountType = (mountType: MountType) => {
    setConfig((prev) => ({ ...prev, mountType }));
  };

  const updateOpacity = (opacity: number) => {
    setConfig((prev) => ({ ...prev, opacity }));
  };

  const updateTexture = (texture: TextureType) => {
    setConfig((prev) => ({ ...prev, texture }));
  };

  const toggleMeasurements = () => {
    setConfig((prev) => ({ ...prev, showMeasurements: !prev.showMeasurements }));
  };

  const updateOpenness = (amount: number) => {
    setConfig((prev) => ({
      ...prev,
      openAmount: amount,
      isOpen: amount > 0.05,
    }));
  };

  const updatePanelCount = (count: number) => {
    setConfig((prev) => ({ ...prev, panelCount: count }));
  };

  const updatePreviewMode = (previewMode: PreviewMode) => {
    setConfig((prev) => ({ ...prev, previewMode }));
  };

  const updateScenePreset = (scenePreset: ScenePreset) => {
    setConfig((prev) => ({ ...prev, scenePreset }));
  };

  const updateQualityMode = (qualityMode: QualityMode) => {
    setConfig((prev) => ({ ...prev, qualityMode }));
  };

  const toggleAutoRotate = () => {
    setConfig((prev) => ({ ...prev, autoRotate: !prev.autoRotate }));
  };

  return {
    config,
    defaultConfig: DEFAULT_CONFIG,
    replaceConfig,
    resetConfig,
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
    updatePreviewMode,
    updateScenePreset,
    updateQualityMode,
    toggleAutoRotate,
  };
};
