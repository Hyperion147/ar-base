import { useState } from 'react';
import type { ProductConfig, ProductType, CurtainStyle, BlindStyle, ShadeStyle, DrapeStyle, MountType, TextureType } from '../types';

export const useProductConfig = () => {
  const [config, setConfig] = useState<ProductConfig>({
    selectedProduct: null,
    curtainStyle: 'sheer',
    blindStyle: 'roller',
    shadeStyle: 'honeycomb',
    drapeStyle: 'classic',
    color: '#000000',
    dimensions: { width: 150, height: 200, drop: 0 },
    mountType: 'outside',
    opacity: 0.4,
    texture: 'fabric',
    showMeasurements: false,
    isOpen: true,
    openAmount: 1,
    panelCount: 2,
    isViewLocked: false,
  });

  const updateProduct = (product: ProductType) => {
    setConfig(prev => ({ ...prev, selectedProduct: product }));
  };

  const updateCurtainStyle = (style: CurtainStyle) => {
    setConfig(prev => ({ ...prev, curtainStyle: style }));
  };

  const updateBlindStyle = (style: BlindStyle) => {
    setConfig(prev => ({ ...prev, blindStyle: style }));
  };

  const updateShadeStyle = (style: ShadeStyle) => {
    setConfig(prev => ({ ...prev, shadeStyle: style }));
  };

  const updateDrapeStyle = (style: DrapeStyle) => {
    setConfig(prev => ({ ...prev, drapeStyle: style }));
  };

  const updateColor = (color: string) => {
    setConfig(prev => ({ ...prev, color }));
  };

  const updateDimensions = (dimensions: Partial<ProductConfig['dimensions']>) => {
    setConfig(prev => ({
      ...prev,
      dimensions: { ...prev.dimensions, ...dimensions }
    }));
  };

  const updateMountType = (mountType: MountType) => {
    setConfig(prev => ({ ...prev, mountType }));
  };

  const updateOpacity = (opacity: number) => {
    setConfig(prev => ({ ...prev, opacity }));
  };

  const updateTexture = (texture: TextureType) => {
    setConfig(prev => ({ ...prev, texture }));
  };

  const toggleMeasurements = () => {
    setConfig(prev => ({ ...prev, showMeasurements: !prev.showMeasurements }));
  };

  const updateOpenness = (amount: number) => {
    setConfig(prev => ({
      ...prev,
      openAmount: amount,
      isOpen: amount > 0
    }));
  };

  const updatePanelCount = (count: number) => {
    setConfig(prev => ({ ...prev, panelCount: count }));
  };

  const toggleViewLock = () => {
    setConfig(prev => ({ ...prev, isViewLocked: !prev.isViewLocked }));
  };

  return {
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
  };
};

