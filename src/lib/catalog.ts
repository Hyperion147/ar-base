import { MdGrid4X4, MdOutlineWindow, MdStraighten, MdWaves, MdWindow } from 'react-icons/md';
import type {
  BlindStyle,
  CurtainStyle,
  DrapeStyle,
  ProductType,
  ScenePreset,
  ShadeStyle,
  TextureType,
} from '../types';

export const PRODUCT_DEFINITIONS: Array<{
  id: Exclude<ProductType, null>;
  name: string;
  description: string;
  Icon: typeof MdWindow;
  outlineIcon: typeof MdWindow;
  badge: string;
}> = [
  {
    id: 'curtain',
    name: 'Curtains',
    description: 'Soft fabric panels for relaxed, layered rooms.',
    Icon: MdWindow,
    outlineIcon: MdOutlineWindow,
    badge: 'Best for bedrooms',
  },
  {
    id: 'blind',
    name: 'Blinds',
    description: 'Precise light control for modern, compact spaces.',
    Icon: MdStraighten,
    outlineIcon: MdStraighten,
    badge: 'Best for offices',
  },
  {
    id: 'shade',
    name: 'Shades',
    description: 'Streamlined coverage with a softer architectural look.',
    Icon: MdGrid4X4,
    outlineIcon: MdGrid4X4,
    badge: 'Best for living rooms',
  },
  {
    id: 'drape',
    name: 'Drapes',
    description: 'Premium statement treatment with fuller folds and drama.',
    Icon: MdWaves,
    outlineIcon: MdWaves,
    badge: 'Best for premium installs',
  },
];

export const CURTAIN_STYLES: CurtainStyle[] = ['sheer', 'blackout', 'velvet', 'linen'];
export const BLIND_STYLES: BlindStyle[] = ['roller', 'venetian', 'vertical', 'roman'];
export const SHADE_STYLES: ShadeStyle[] = ['honeycomb', 'pleated', 'solar', 'bamboo'];
export const DRAPE_STYLES: DrapeStyle[] = ['classic', 'modern', 'luxury', 'minimal'];
export const TEXTURES: TextureType[] = ['smooth', 'fabric', 'woven'];

export const SCENE_PRESETS: Array<{
  id: ScenePreset;
  name: string;
  mood: string;
}> = [
  { id: 'gallery', name: 'Gallery', mood: 'Bright neutral room for clean product review' },
  { id: 'sunset', name: 'Sunset', mood: 'Warm residential lighting for lifestyle previews' },
  { id: 'midnight', name: 'Midnight', mood: 'Darker showroom contrast for premium fabrics' },
];
