import type { ProductConfig } from '../types';

const PRODUCT_BASE: Record<NonNullable<ProductConfig['selectedProduct']>, number> = {
  curtain: 155,
  blind: 140,
  shade: 148,
  drape: 178,
};

const STYLE_FACTOR = {
  sheer: 1.02,
  blackout: 1.12,
  velvet: 1.3,
  linen: 1.1,
  roller: 1,
  venetian: 1.14,
  vertical: 1.08,
  roman: 1.16,
  honeycomb: 1.18,
  pleated: 1.05,
  solar: 1.12,
  bamboo: 1.22,
  classic: 1.08,
  modern: 1.12,
  luxury: 1.35,
  minimal: 1.04,
} as const;

const TEXTURE_FACTOR = {
  smooth: 1,
  fabric: 1.06,
  woven: 1.12,
} as const;

const SCENE_FACTOR = {
  gallery: 1,
  sunset: 1.03,
  midnight: 1.05,
} as const;

export function getAreaSqM(config: ProductConfig) {
  return (config.dimensions.width * config.dimensions.height) / 10000;
}

export function getCurrentStyle(config: ProductConfig) {
  switch (config.selectedProduct) {
    case 'curtain':
      return config.curtainStyle;
    case 'blind':
      return config.blindStyle;
    case 'shade':
      return config.shadeStyle;
    case 'drape':
      return config.drapeStyle;
    default:
      return config.curtainStyle;
  }
}

export function estimateProject(config: ProductConfig) {
  const product = config.selectedProduct ?? 'curtain';
  const area = getAreaSqM(config);
  const style = getCurrentStyle(config);
  const base = PRODUCT_BASE[product];
  const textureFactor = TEXTURE_FACTOR[config.texture];
  const styleFactor = STYLE_FACTOR[style];
  const sceneFactor = SCENE_FACTOR[config.scenePreset];
  const opennessFactor = 1 + (1 - config.openAmount) * 0.12;
  const panelFactor = product === 'curtain' || product === 'drape' ? 1 + (config.panelCount - 2) * 0.035 : 1;
  const mountFactor = config.mountType === 'outside' ? 1.04 : 1;

  const price = area * base * textureFactor * styleFactor * sceneFactor * opennessFactor * panelFactor * mountFactor;
  const installDays = Math.max(5, Math.round(6 + area * 1.4 + (styleFactor - 1) * 10));

  return {
    area,
    estimatedPrice: Math.round(price),
    installDays,
  };
}
