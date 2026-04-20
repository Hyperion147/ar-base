import type { IconType } from 'react-icons';
import { Vector3, Matrix4 } from 'three';

export type ProductType = 'curtain' | 'blind' | 'shade' | 'drape' | null;
export type CurtainStyle = 'sheer' | 'blackout' | 'velvet' | 'linen';
export type BlindStyle = 'roller' | 'venetian' | 'vertical' | 'roman';
export type ShadeStyle = 'honeycomb' | 'pleated' | 'solar' | 'bamboo';
export type DrapeStyle = 'classic' | 'modern' | 'luxury' | 'minimal';
export type MountType = 'inside' | 'outside';
export type TextureType = 'smooth' | 'fabric' | 'woven';
export type ActiveTab = 'products' | 'styles' | 'dimensions' | 'colors' | 'settings' | null;

export interface Dimensions {
  width: number;
  height: number;
  drop: number;
}

export interface ProductConfig {
  selectedProduct: ProductType;
  curtainStyle: CurtainStyle;
  blindStyle: BlindStyle;
  shadeStyle: ShadeStyle;
  drapeStyle: DrapeStyle;
  color: string;
  dimensions: Dimensions;
  mountType: MountType;
  opacity: number;
  texture: TextureType;
  showMeasurements: boolean;
  isOpen: boolean;
  openAmount: number;
  panelCount: number;
}


export interface TabConfig {
  id: string;
  icon: IconType;
  iconOutlined: IconType;
  label: string;
}

// New types for corner detection workflow
export interface WindowCorners {
  topLeft: Vector3;
  topRight: Vector3;
  bottomLeft: Vector3;
  bottomRight: Vector3;
}

export interface BoundingBox {
  min: Vector3;
  max: Vector3;
  center: Vector3;
}

export interface SurfaceDetection {
  corners: WindowCorners;
  boundingBox: BoundingBox;
  perspectiveMatrix: Matrix4;
  surfaceArea: number;
  normal: Vector3;
}

export type DetectionStage = 'idle' | 'detecting' | 'drawing' | 'completed';

export interface CornerDetection {
  corners: Vector3[];
  stage: DetectionStage;
  boundingBox: BoundingBox | null;
  surfaceArea: number;
  perspectiveMatrix: Matrix4 | null;
}
