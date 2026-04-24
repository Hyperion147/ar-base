import { useRef, useState, type ReactNode } from 'react';
import {
  MdAutoAwesome,
  MdCameraAlt,
  MdChecklist,
  MdContentCopy,
  MdDownload,
  MdGridView,
  MdLayers,
  MdOutlineRestartAlt,
  MdPalette,
  MdPhotoLibrary,
  MdSave,
  MdStraighten,
  MdTune,
} from 'react-icons/md';
import { Viewer, type ViewerHandle } from '../features/viewer/Viewer';
import { COLOR_PRESETS } from '../constants/colors';
import { useProductConfig } from '../hooks/useProductConfig';
import { getCurrentStyle } from '../lib/estimate';
import {
  BLIND_STYLES,
  CURTAIN_STYLES,
  DRAPE_STYLES,
  PRODUCT_DEFINITIONS,
  SCENE_PRESETS,
  SHADE_STYLES,
  TEXTURES,
} from '../lib/catalog';
import type { ProductConfig } from '../types';

type ToastTone = 'success' | 'info';
type SidebarSection = 'products' | 'customize' | 'scene' | 'library';

const SAVED_KEY = 'ar-base:saved-designs:v2';

function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function getStyleOptions(config: ProductConfig) {
  switch (config.selectedProduct) {
    case 'curtain':
      return CURTAIN_STYLES;
    case 'blind':
      return BLIND_STYLES;
    case 'shade':
      return SHADE_STYLES;
    case 'drape':
      return DRAPE_STYLES;
    default:
      return CURTAIN_STYLES;
  }
}

function buildSpecSheet(config: ProductConfig) {
  return [
    'AR Base Specification Sheet',
    '',
    `Product: ${config.selectedProduct}`,
    `Style: ${getCurrentStyle(config)}`,
    `Color: ${config.color}`,
    `Texture: ${config.texture}`,
    `Mount: ${config.mountType}`,
    `Width: ${config.dimensions.width} cm`,
    `Height: ${config.dimensions.height} cm`,
    `Floor drop: ${config.dimensions.drop} cm`,
    `Open amount: ${Math.round(config.openAmount * 100)}%`,
    `Panels: ${config.panelCount}`,
    `Preview mode: ${config.previewMode}`,
    `Scene preset: ${config.scenePreset}`,
    `Quality mode: ${config.qualityMode}`,
  ].join('\n');
}

export default function ARDashboard() {
  const viewerRef = useRef<ViewerHandle>(null);
  const toastTimerRef = useRef<number | null>(null);
  const [sidebarSection, setSidebarSection] = useState<SidebarSection>('products');
  const [toast, setToast] = useState<{ message: string; tone: ToastTone } | null>(null);
  const [savedDesigns, setSavedDesigns] = useState<Array<{ id: string; createdAt: string; config: ProductConfig }>>(() => {
    const raw = window.localStorage.getItem(SAVED_KEY);
    if (!raw) return [];
    try {
      return JSON.parse(raw) as Array<{ id: string; createdAt: string; config: ProductConfig }>;
    } catch {
      return [];
    }
  });

  const {
    config,
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
  } = useProductConfig();

  const currentStyleOptions = getStyleOptions(config);
  const currentStyle = getCurrentStyle(config);
  const selectedProduct = PRODUCT_DEFINITIONS.find((product) => product.id === config.selectedProduct) ?? PRODUCT_DEFINITIONS[0];

  const showToast = (message: string, tone: ToastTone = 'success') => {
    setToast({ message, tone });
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = window.setTimeout(() => setToast(null), 2600);
  };

  const persistDesigns = (nextDesigns: Array<{ id: string; createdAt: string; config: ProductConfig }>) => {
    setSavedDesigns(nextDesigns);
    window.localStorage.setItem(SAVED_KEY, JSON.stringify(nextDesigns));
  };

  const handleSaveDesign = () => {
    const entry = {
      id: crypto.randomUUID(),
      createdAt: new Date().toLocaleString(),
      config,
    };
    persistDesigns([entry, ...savedDesigns].slice(0, 6));
    showToast('Design saved locally');
  };

  const handleShare = async () => {
    const url = new URL(window.location.href);
    url.searchParams.set('design', encodeURIComponent(JSON.stringify(config)));
    try {
      await navigator.clipboard.writeText(url.toString());
      showToast('Share link copied');
    } catch {
      showToast('Could not copy link automatically', 'info');
    }
  };

  const handleSpecDownload = () => {
    const specs = buildSpecSheet(config);
    downloadBlob('window-treatment-specs.txt', new Blob([specs], { type: 'text/plain;charset=utf-8' }));
    showToast('Specification sheet downloaded');
  };

  const handleSnapshotDownload = () => {
    const image = viewerRef.current?.captureSnapshot();
    if (!image) {
      showToast('Snapshot capture failed', 'info');
      return;
    }

    const anchor = document.createElement('a');
    anchor.href = image;
    anchor.download = 'window-treatment-preview.png';
    anchor.click();
    showToast('Preview image downloaded');
  };

  const updateStyle = (style: string) => {
    switch (config.selectedProduct) {
      case 'curtain':
        updateCurtainStyle(style as ProductConfig['curtainStyle']);
        break;
      case 'blind':
        updateBlindStyle(style as ProductConfig['blindStyle']);
        break;
      case 'shade':
        updateShadeStyle(style as ProductConfig['shadeStyle']);
        break;
      case 'drape':
        updateDrapeStyle(style as ProductConfig['drapeStyle']);
        break;
      default:
        break;
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#f7efe4_0%,#ecdcc9_40%,#d3bba1_100%)] px-3 py-3 text-[#21150f] sm:px-4 sm:py-4">
      <div className="mx-auto grid min-h-[calc(100dvh-1.5rem)] max-w-[1800px] grid-cols-1 gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
        <aside className="order-2 xl:order-1 xl:sticky xl:top-3 xl:h-[calc(100dvh-1.5rem)]">
          <div className="flex h-full flex-col overflow-hidden rounded-[32px] border border-white/70 bg-white/78 shadow-[0_28px_90px_rgba(88,57,36,0.14)] backdrop-blur-xl">
            <div className="border-b border-[#eadbc9] bg-[#231711] px-5 py-5 text-white">
              <p className="text-[0.68rem] uppercase tracking-[0.32em] text-white/55">Configurator</p>
              <h1 className="mt-3 font-serif text-[2rem] leading-none">Sidebar-first workflow.</h1>
              <p className="mt-3 text-sm leading-6 text-white/70">
                Keep the preview visible and switch control groups from the sidebar instead of scrolling through the whole app.
              </p>
            </div>

            <div className="grid grid-cols-4 gap-2 border-b border-[#eadbc9] bg-[#f8f1e7] p-3">
              <SidebarButton icon={<MdGridView className="text-lg" />} label="Products" active={sidebarSection === 'products'} onClick={() => setSidebarSection('products')} />
              <SidebarButton icon={<MdTune className="text-lg" />} label="Customize" active={sidebarSection === 'customize'} onClick={() => setSidebarSection('customize')} />
              <SidebarButton icon={<MdLayers className="text-lg" />} label="Scene" active={sidebarSection === 'scene'} onClick={() => setSidebarSection('scene')} />
              <SidebarButton icon={<MdPhotoLibrary className="text-lg" />} label="Library" active={sidebarSection === 'library'} onClick={() => setSidebarSection('library')} />
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {sidebarSection === 'products' && (
                <div className="space-y-4">
                  <SectionCard title="Select Product" icon={<MdGridView className="text-xl" />}>
                    <div className="grid gap-3">
                      {PRODUCT_DEFINITIONS.map((product) => {
                        const ActiveIcon = config.selectedProduct === product.id ? product.Icon : product.outlineIcon;
                        const active = config.selectedProduct === product.id;
                        return (
                          <button
                            key={product.id}
                            onClick={() => updateProduct(product.id)}
                            className={`rounded-[24px] border p-4 text-left transition ${
                              active
                                ? 'border-[#b57b56] bg-[#1f1712] text-white shadow-[0_16px_36px_rgba(31,23,18,0.2)]'
                                : 'border-[#eadbc9] bg-white text-[#2e2018] hover:border-[#c39573]'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-4">
                              <ActiveIcon className={`text-3xl ${active ? 'text-[#f2d1b5]' : 'text-[#8e5d3f]'}`} />
                              <span className={`rounded-full px-3 py-1 text-[0.62rem] uppercase tracking-[0.24em] ${active ? 'bg-white/10 text-white/70' : 'bg-[#f6ede1] text-[#8e5d3f]'}`}>
                                {product.badge}
                              </span>
                            </div>
                            <h3 className="mt-4 text-lg font-semibold">{product.name}</h3>
                            <p className={`mt-1 text-sm leading-6 ${active ? 'text-white/70' : 'text-[#6f5848]'}`}>{product.description}</p>
                          </button>
                        );
                      })}
                    </div>
                  </SectionCard>
                </div>
              )}

              {sidebarSection === 'customize' && (
                <div className="space-y-4">
                  <SectionCard title="Style" icon={<MdPalette className="text-xl" />}>
                    <div className="grid grid-cols-2 gap-2">
                      {currentStyleOptions.map((style) => (
                        <button
                          key={style}
                          onClick={() => updateStyle(style)}
                          className={`rounded-[18px] border px-4 py-3 text-sm font-medium capitalize ${
                            currentStyle === style ? 'border-[#1f1712] bg-[#1f1712] text-white' : 'border-[#eee1d0] bg-[#fcfaf7] text-[#4e382d]'
                          }`}
                        >
                          {style}
                        </button>
                      ))}
                    </div>

                    <label className="mt-5 block text-xs uppercase tracking-[0.22em] text-[#7c6354]">Texture</label>
                    <div className="mt-2 grid grid-cols-3 gap-2">
                      {TEXTURES.map((texture) => (
                        <button
                          key={texture}
                          onClick={() => updateTexture(texture)}
                          className={`rounded-[16px] px-3 py-3 text-xs font-semibold uppercase tracking-[0.18em] ${
                            config.texture === texture ? 'bg-[#b57b56] text-white' : 'bg-[#f6ede1] text-[#714f3b]'
                          }`}
                        >
                          {texture}
                        </button>
                      ))}
                    </div>
                  </SectionCard>

                  <SectionCard title="Finish" icon={<MdAutoAwesome className="text-xl" />}>
                    <div className="grid grid-cols-4 gap-2">
                      {COLOR_PRESETS.map((preset) => (
                        <button
                          key={preset.value}
                          onClick={() => updateColor(preset.value)}
                          title={preset.name}
                          className={`aspect-square rounded-[18px] border-2 ${
                            config.color === preset.value ? 'border-[#1f1712] shadow-[0_10px_24px_rgba(45,29,20,0.2)]' : 'border-white'
                          }`}
                          style={{ backgroundColor: preset.value }}
                        />
                      ))}
                    </div>
                    <input
                      type="color"
                      value={config.color}
                      onChange={(event) => updateColor(event.target.value)}
                      className="mt-4 h-12 w-full cursor-pointer rounded-[18px] border border-[#eadbc9] bg-transparent"
                    />
                  </SectionCard>

                  <SectionCard title="Dimensions" icon={<MdStraighten className="text-xl" />}>
                    <DimensionInput label="Width" value={config.dimensions.width} onChange={(value) => updateDimensions({ width: value })} />
                    <DimensionInput label="Height" value={config.dimensions.height} onChange={(value) => updateDimensions({ height: value })} />
                    <DimensionInput label="Drop" value={config.dimensions.drop} onChange={(value) => updateDimensions({ drop: value })} />
                    <RangeControl label="Open amount" value={config.openAmount} display={`${Math.round(config.openAmount * 100)}%`} min={0} max={1} step={0.01} onChange={(value) => updateOpenness(value)} />
                    <RangeControl label="Transparency" value={config.opacity} display={`${Math.round(config.opacity * 100)}%`} min={0.15} max={1} step={0.01} onChange={(value) => updateOpacity(value)} />
                    {(config.selectedProduct === 'curtain' || config.selectedProduct === 'drape') && (
                      <RangeControl label="Panels" value={config.panelCount} display={`${config.panelCount}`} min={1} max={8} step={1} onChange={(value) => updatePanelCount(value)} />
                    )}
                  </SectionCard>
                </div>
              )}

              {sidebarSection === 'scene' && (
                <div className="space-y-4">
                  <SectionCard title="Preview Mode" icon={<MdCameraAlt className="text-xl" />}>
                    <SegmentedControl
                      options={[
                        { value: 'studio', label: 'Studio' },
                        { value: 'camera', label: 'Camera' },
                      ]}
                      active={config.previewMode}
                      onChange={(value) => updatePreviewMode(value as ProductConfig['previewMode'])}
                    />
                    <div className="mt-4 space-y-2">
                      {SCENE_PRESETS.map((scene) => (
                        <button
                          key={scene.id}
                          onClick={() => updateScenePreset(scene.id)}
                          className={`w-full rounded-[18px] border px-4 py-3 text-left ${
                            config.scenePreset === scene.id ? 'border-[#1f1712] bg-[#1f1712] text-white' : 'border-[#eadbc9] bg-[#f9f4ec] text-[#523c30]'
                          }`}
                        >
                          <div className="text-sm font-semibold">{scene.name}</div>
                          <div className={`mt-1 text-xs ${config.scenePreset === scene.id ? 'text-white/65' : 'text-[#7c6354]'}`}>{scene.mood}</div>
                        </button>
                      ))}
                    </div>
                  </SectionCard>

                  <SectionCard title="Viewer Controls" icon={<MdTune className="text-xl" />}>
                    <SegmentedControl
                      options={[
                        { value: 'balanced', label: 'Balanced' },
                        { value: 'quality', label: 'Quality' },
                      ]}
                      active={config.qualityMode}
                      onChange={(value) => updateQualityMode(value as ProductConfig['qualityMode'])}
                    />
                    <ToggleRow label="Measurements" active={config.showMeasurements} onClick={toggleMeasurements} />
                    <ToggleRow label="Auto rotate" active={config.autoRotate} onClick={toggleAutoRotate} />
                    <ToggleRow
                      label={`Mount: ${config.mountType}`}
                      active={config.mountType === 'outside'}
                      onClick={() => updateMountType(config.mountType === 'outside' ? 'inside' : 'outside')}
                    />
                  </SectionCard>
                </div>
              )}

              {sidebarSection === 'library' && (
                <div className="space-y-4">
                  <SectionCard title="Actions" icon={<MdSave className="text-xl" />}>
                    <ActionButton icon={<MdSave className="text-xl" />} title="Save design" description="Store this version locally." onClick={handleSaveDesign} />
                    <ActionButton icon={<MdContentCopy className="text-xl" />} title="Share config" description="Copy a deep link for this setup." onClick={handleShare} />
                    <ActionButton icon={<MdDownload className="text-xl" />} title="Export preview" description="Download the current scene as PNG." onClick={handleSnapshotDownload} />
                    <ActionButton icon={<MdChecklist className="text-xl" />} title="Download specs" description="Export a simple specification sheet." onClick={handleSpecDownload} />
                  </SectionCard>

                  <SectionCard title="Saved Designs" icon={<MdPhotoLibrary className="text-xl" />}>
                    <div className="space-y-3">
                      {savedDesigns.length === 0 && (
                        <div className="rounded-[20px] border border-dashed border-[#d9c5b0] bg-[#fcf8f2] px-4 py-6 text-sm leading-6 text-[#6f5848]">
                          Save a version to build a shortlist.
                        </div>
                      )}

                      {savedDesigns.map((design) => (
                        <button
                          key={design.id}
                          onClick={() => {
                            replaceConfig(design.config);
                            showToast('Saved design restored');
                          }}
                          className="w-full rounded-[20px] border border-[#eadbc9] bg-[#fcfaf7] px-4 py-4 text-left transition hover:border-[#c39573]"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="text-xs uppercase tracking-[0.24em] text-[#8e5d3f]">{design.config.selectedProduct}</p>
                              <h3 className="mt-1 text-lg font-semibold capitalize text-[#251710]">{getCurrentStyle(design.config)}</h3>
                              <p className="mt-1 text-sm text-[#6f5848]">
                                {design.config.dimensions.width} x {design.config.dimensions.height} cm
                              </p>
                            </div>
                            <div className="h-9 w-9 rounded-full border border-[#eadbc9]" style={{ backgroundColor: design.config.color }} />
                          </div>
                          <p className="mt-3 text-xs uppercase tracking-[0.22em] text-[#8f7665]">{design.createdAt}</p>
                        </button>
                      ))}
                    </div>
                  </SectionCard>

                  <button
                    onClick={() => {
                      resetConfig();
                      showToast('Configurator reset', 'info');
                    }}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#1f1712] px-5 py-3 text-sm font-semibold text-white"
                  >
                    <MdOutlineRestartAlt className="text-lg" />
                    Reset design
                  </button>
                </div>
              )}
            </div>
          </div>
        </aside>

        <main className="order-1 xl:order-2">
          <div className="flex h-full flex-col rounded-[32px] border border-white/70 bg-white/35 p-3 shadow-[0_28px_90px_rgba(88,57,36,0.12)] backdrop-blur-xl xl:h-[calc(100dvh-1.5rem)]">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-[24px] bg-white/55 px-4 py-3">
              <div>
                <p className="text-[0.68rem] uppercase tracking-[0.3em] text-[#8e5d3f]">Active Design</p>
                <h2 className="mt-1 font-serif text-2xl text-[#24160f] capitalize sm:text-3xl">
                  {selectedProduct.name} / {currentStyle}
                </h2>
              </div>
              <div className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.18em] text-[#6a4d3b]">
                <Badge>{config.texture}</Badge>
                <Badge>{config.scenePreset}</Badge>
                <Badge>{config.previewMode}</Badge>
                <Badge>{config.mountType} mount</Badge>
              </div>
            </div>

            <div className="min-h-[420px] flex-1">
              <Viewer key={config.previewMode} ref={viewerRef} config={config} />
            </div>
          </div>
        </main>
      </div>

      {toast && (
        <div className="pointer-events-none fixed bottom-4 right-3 left-3 z-50 rounded-full border border-white/60 bg-white/88 px-5 py-3 text-center text-sm shadow-[0_22px_65px_rgba(77,47,28,0.2)] backdrop-blur-xl sm:left-auto sm:right-4 sm:text-left">
          <span className={toast.tone === 'success' ? 'text-[#215d3b]' : 'text-[#6a4d3b]'}>{toast.message}</span>
        </div>
      )}
    </div>
  );
}

function SidebarButton({
  icon,
  label,
  active,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex min-h-[68px] flex-col items-center justify-center gap-1 rounded-[18px] px-2 text-center ${
        active ? 'bg-[#1f1712] text-white' : 'bg-white text-[#6a4d3b]'
      }`}
    >
      {icon}
      <span className="text-[0.62rem] font-semibold uppercase tracking-[0.16em]">{label}</span>
    </button>
  );
}

function SectionCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[24px] border border-[#eadbc9] bg-[#fcfaf7] p-4">
      <div className="mb-4 flex items-center gap-2 text-[#8e5d3f]">
        {icon}
        <h3 className="text-sm font-semibold uppercase tracking-[0.22em]">{title}</h3>
      </div>
      {children}
    </section>
  );
}

function ActionButton({
  icon,
  title,
  description,
  onClick,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button onClick={onClick} className="mt-3 w-full rounded-[20px] border border-[#eadbc9] bg-white p-4 text-left transition hover:border-[#c39573]">
      <div className="flex items-center gap-3 text-[#8e5d3f]">
        {icon}
        <span className="text-sm font-semibold uppercase tracking-[0.22em]">{title}</span>
      </div>
      <p className="mt-2 text-sm leading-6 text-[#6f5848]">{description}</p>
    </button>
  );
}

function Badge({ children }: { children: ReactNode }) {
  return <div className="rounded-full bg-[#f3e7d8] px-3 py-2">{children}</div>;
}

function RangeControl({
  label,
  value,
  display,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  display: string;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="mt-5">
      <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-[0.22em] text-[#7c6354]">
        <span>{label}</span>
        <span>{display}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full accent-[#8e5d3f]"
      />
    </div>
  );
}

function DimensionInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="mt-3 block">
      <span className="text-xs uppercase tracking-[0.22em] text-[#7c6354]">{label}</span>
      <input
        type="number"
        min="0"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-2 w-full rounded-[18px] border border-[#eadbc9] bg-white px-4 py-3 text-sm text-[#241913] outline-none"
      />
    </label>
  );
}

function SegmentedControl({
  options,
  active,
  onChange,
}: {
  options: Array<{ value: string; label: string }>;
  active: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2 rounded-[18px] bg-[#f2e7d8] p-1">
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={`rounded-[14px] px-3 py-2 text-sm font-semibold ${active === option.value ? 'bg-[#1f1712] text-white' : 'text-[#6a4d3b]'}`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function ToggleRow({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button onClick={onClick} className="mt-3 flex w-full items-center justify-between rounded-[18px] border border-[#eadbc9] bg-white px-4 py-3 text-sm text-[#241913]">
      <span>{label}</span>
      <span className={`rounded-full px-3 py-1 text-[0.62rem] uppercase tracking-[0.24em] ${active ? 'bg-[#1f1712] text-white' : 'bg-[#f2e7d8] text-[#6a4d3b]'}`}>
        {active ? 'On' : 'Off'}
      </span>
    </button>
  );
}
