import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  MdCameraAlt,
  MdChecklist,
  MdContentCopy,
  MdDownload,
  MdGridView,
  MdLabel,
  MdOutlineRestartAlt,
  MdPalette,
  MdPhotoLibrary,
  MdSave,
  MdStraighten,
  MdTune,
  MdViewInAr,
} from 'react-icons/md';
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
import { Viewer, type ViewerHandle } from '../features/viewer/Viewer';

type WorkflowStep = 'capture' | 'configure' | 'live' | 'ar' | 'save';
type ToastTone = 'success' | 'info';

interface FramePoint {
  x: number;
  y: number;
}

interface AreaFrame {
  points: FramePoint[];
  bounds: { x: number; y: number; width: number; height: number };
}

interface SavedPreviewRecord {
  id: string;
  name: string;
  areaLabel: string;
  createdAt: string;
  capturedImage: string;
  frame: AreaFrame;
  config: ProductConfig;
}

const SAVED_KEY = 'ar-base:saved-site-previews:v1';

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

function buildSpecSheet(config: ProductConfig, previewName: string, areaLabel: string) {
  return [
    'AR Base Employee Preview Sheet',
    '',
    `Preview name: ${previewName || 'Untitled preview'}`,
    `Area: ${areaLabel || 'Unassigned area'}`,
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
    `Quality mode: ${config.qualityMode}`,
  ].join('\n');
}

function frameToDimensions(frame: AreaFrame) {
  const width = Math.round(120 + frame.bounds.width * 220);
  const height = Math.round(120 + frame.bounds.height * 260);
  return { width, height, drop: 6 };
}

export default function ARDashboard() {
  const viewerRef = useRef<ViewerHandle>(null);
  const toastTimerRef = useRef<number | null>(null);
  const [workflowStep, setWorkflowStep] = useState<WorkflowStep>('capture');
  const [toast, setToast] = useState<{ message: string; tone: ToastTone } | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [capturedFrame, setCapturedFrame] = useState<AreaFrame | null>(null);
  const [previewName, setPreviewName] = useState('');
  const [areaLabel, setAreaLabel] = useState('');
  const [savedPreviews, setSavedPreviews] = useState<SavedPreviewRecord[]>(() => {
    const raw = window.localStorage.getItem(SAVED_KEY);
    if (!raw) return [];
    try {
      return JSON.parse(raw) as SavedPreviewRecord[];
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

  useEffect(() => {
    if (workflowStep === 'configure' || workflowStep === 'save') {
      updatePreviewMode('studio');
      return;
    }

    if (workflowStep === 'live' || workflowStep === 'ar') {
      updatePreviewMode('camera');
    }
  }, [updatePreviewMode, workflowStep]);

  const persistSavedPreviews = (nextRecords: SavedPreviewRecord[]) => {
    setSavedPreviews(nextRecords);
    window.localStorage.setItem(SAVED_KEY, JSON.stringify(nextRecords));
  };

  const handleAreaConfirmed = (image: string, frame: AreaFrame) => {
    setCapturedImage(image);
    setCapturedFrame(frame);
    updateDimensions(frameToDimensions(frame));
    if (!areaLabel) {
      setAreaLabel('Bedroom');
    }
    setWorkflowStep('configure');
    showToast('Area captured and ready for configuration');
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

  const handleSnapshotDownload = () => {
    const image = viewerRef.current?.captureSnapshot();
    if (!image) {
      showToast('Preview export failed', 'info');
      return;
    }

    const anchor = document.createElement('a');
    anchor.href = image;
    anchor.download = `${previewName || 'site-preview'}.png`;
    anchor.click();
    showToast('Preview image downloaded');
  };

  const handleSpecDownload = () => {
    const specSheet = buildSpecSheet(config, previewName, areaLabel);
    downloadBlob(`${previewName || 'site-preview'}-specs.txt`, new Blob([specSheet], { type: 'text/plain;charset=utf-8' }));
    showToast('Employee preview sheet downloaded');
  };

  const handleSavePreview = () => {
    if (!capturedImage || !capturedFrame) {
      showToast('Capture an area before saving', 'info');
      return;
    }

    const nextRecord: SavedPreviewRecord = {
      id: crypto.randomUUID(),
      name: previewName || 'Untitled preview',
      areaLabel: areaLabel || 'Unassigned area',
      createdAt: new Date().toLocaleString(),
      capturedImage,
      frame: capturedFrame,
      config,
    };

    persistSavedPreviews([nextRecord, ...savedPreviews].slice(0, 12));
    showToast('Preview saved for the team');
  };

  const handleRestorePreview = (record: SavedPreviewRecord) => {
    replaceConfig(record.config);
    setCapturedImage(record.capturedImage);
    setCapturedFrame(record.frame);
    setPreviewName(record.name);
    setAreaLabel(record.areaLabel);
    setWorkflowStep('configure');
    showToast('Saved employee preview restored');
  };

  const handleLaunchAR = async () => {
    try {
      await viewerRef.current?.enterAR();
      showToast('AR session requested');
    } catch {
      showToast('AR is not available on this device/browser', 'info');
    }
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

  const completedStepIndex = useMemo(() => {
    if (!capturedImage || !capturedFrame) return 0;
    if (workflowStep === 'capture') return 0;
    if (workflowStep === 'configure') return 1;
    if (workflowStep === 'live') return 2;
    if (workflowStep === 'ar') return 3;
    return 4;
  }, [capturedFrame, capturedImage, workflowStep]);

  return (
    <div className="ui-flat-shell min-h-screen bg-[radial-gradient(circle_at_top,#f7efe4_0%,#ecdcc9_40%,#d3bba1_100%)] px-3 py-3 text-[#21150f] sm:px-4 sm:py-4">
      <div className="mx-auto grid min-h-[calc(100dvh-1.5rem)] max-w-[1800px] grid-cols-1 gap-4 xl:grid-cols-[390px_minmax(0,1fr)]">
        <aside className="order-2 xl:order-1 xl:sticky xl:top-3 xl:h-[calc(100dvh-1.5rem)]">
          <div className="flex h-full flex-col overflow-hidden border border-white/70 bg-white/78 backdrop-blur-xl">
            <div className="border-b border-[#eadbc9] bg-[#231711] px-5 py-5 text-white">
              <p className="text-[0.68rem] uppercase tracking-[0.32em] text-white/55">Employee Workflow</p>
              <h1 className="mt-3 font-serif text-[2rem] leading-none">Site capture to locked placement.</h1>
              <p className="mt-3 text-sm leading-6 text-white/70">
                Capture the site, configure the model, review the live camera overlay, place it in AR, then save it under a named area for the team.
              </p>
            </div>

            <div className="border-b border-[#eadbc9] bg-[#f8f1e7] p-3">
              <div className="grid grid-cols-5 gap-2">
                <StepButton label="Capture" active={workflowStep === 'capture'} enabled onClick={() => setWorkflowStep('capture')} />
                <StepButton label="Configure" active={workflowStep === 'configure'} enabled={completedStepIndex >= 1} onClick={() => setWorkflowStep('configure')} />
                <StepButton label="Live" active={workflowStep === 'live'} enabled={completedStepIndex >= 1} onClick={() => setWorkflowStep('live')} />
                <StepButton label="AR" active={workflowStep === 'ar'} enabled={completedStepIndex >= 1} onClick={() => setWorkflowStep('ar')} />
                <StepButton label="Save" active={workflowStep === 'save'} enabled={completedStepIndex >= 1} onClick={() => setWorkflowStep('save')} />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {workflowStep === 'capture' && (
                <div className="space-y-4">
                  <SectionCard title="Capture Rules" icon={<MdCameraAlt className="text-xl" />}>
                    <InfoLine label="1" text="Open the camera, take a site photo, and mark the opening corners or use auto-fit." />
                    <InfoLine label="2" text="The selected frame becomes the base area for the preview dimensions." />
                    <InfoLine label="3" text="Once confirmed, move to configure without repeating the capture." />
                  </SectionCard>

                  <SectionCard title="Job Details" icon={<MdLabel className="text-xl" />}>
                    <TextInput label="Preview Name" value={previewName} onChange={setPreviewName} placeholder="Client master bedroom north window" />
                    <TextInput label="Area Label" value={areaLabel} onChange={setAreaLabel} placeholder="Bedroom / Living room / 1st floor" />
                  </SectionCard>
                </div>
              )}

              {(workflowStep === 'configure' || workflowStep === 'live' || workflowStep === 'ar') && (
                <div className="space-y-4">
                  <SectionCard title="Model Type" icon={<MdGridView className="text-xl" />}>
                    <div className="grid gap-3">
                      {PRODUCT_DEFINITIONS.map((product) => {
                        const ActiveIcon = config.selectedProduct === product.id ? product.Icon : product.outlineIcon;
                        const active = config.selectedProduct === product.id;
                        return (
                          <button
                            key={product.id}
                            onClick={() => updateProduct(product.id)}
                            className={`border p-4 text-left transition ${active ? 'bg-[#1f1712] text-white' : 'bg-white text-[#2e2018]'}`}
                          >
                            <div className="flex items-start justify-between gap-4">
                              <ActiveIcon className={`text-3xl ${active ? 'text-[#f2d1b5]' : 'text-[#8e5d3f]'}`} />
                              <span className={`border px-3 py-1 text-[0.62rem] uppercase tracking-[0.24em] ${active ? 'border-white/25 bg-white/10 text-white/70' : 'border-[#eadbc9] bg-[#f6ede1] text-[#8e5d3f]'}`}>
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

                  <SectionCard title="Style & Finish" icon={<MdPalette className="text-xl" />}>
                    <div className="grid grid-cols-2 gap-2">
                      {currentStyleOptions.map((style) => (
                        <button
                          key={style}
                          onClick={() => updateStyle(style)}
                          className={`border px-4 py-3 text-sm font-medium capitalize ${currentStyle === style ? 'bg-[#1f1712] text-white' : 'bg-[#fcfaf7] text-[#4e382d]'}`}
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
                          className={`px-3 py-3 text-xs font-semibold uppercase tracking-[0.18em] ${config.texture === texture ? 'bg-[#b57b56] text-white' : 'bg-[#f6ede1] text-[#714f3b]'}`}
                        >
                          {texture}
                        </button>
                      ))}
                    </div>

                    <div className="mt-4 grid grid-cols-4 gap-2">
                      {COLOR_PRESETS.map((preset) => (
                        <button
                          key={preset.value}
                          onClick={() => updateColor(preset.value)}
                          title={preset.name}
                          className={`aspect-square border-2 ${config.color === preset.value ? 'border-[#1f1712]' : 'border-white'}`}
                          style={{ backgroundColor: preset.value }}
                        />
                      ))}
                    </div>

                    <input type="color" value={config.color} onChange={(event) => updateColor(event.target.value)} className="mt-4 h-12 w-full cursor-pointer border border-[#eadbc9] bg-transparent" />
                  </SectionCard>

                  <SectionCard title="Sizing & Control" icon={<MdStraighten className="text-xl" />}>
                    <DimensionInput label="Width" value={config.dimensions.width} onChange={(value) => updateDimensions({ width: value })} />
                    <DimensionInput label="Height" value={config.dimensions.height} onChange={(value) => updateDimensions({ height: value })} />
                    <DimensionInput label="Drop" value={config.dimensions.drop} onChange={(value) => updateDimensions({ drop: value })} />
                    <RangeControl label="Open amount" value={config.openAmount} display={`${Math.round(config.openAmount * 100)}%`} min={0} max={1} step={0.01} onChange={(value) => updateOpenness(value)} />
                    <RangeControl label="Transparency" value={config.opacity} display={`${Math.round(config.opacity * 100)}%`} min={0.15} max={1} step={0.01} onChange={(value) => updateOpacity(value)} />
                    {(config.selectedProduct === 'curtain' || config.selectedProduct === 'drape') && (
                      <RangeControl label="Panels" value={config.panelCount} display={`${config.panelCount}`} min={1} max={8} step={1} onChange={(value) => updatePanelCount(value)} />
                    )}
                  </SectionCard>

                  <SectionCard title="Placement Settings" icon={<MdTune className="text-xl" />}>
                    <SegmentedControl
                      options={[
                        { value: 'balanced', label: 'Balanced' },
                        { value: 'quality', label: 'Quality' },
                      ]}
                      active={config.qualityMode}
                      onChange={(value) => updateQualityMode(value as ProductConfig['qualityMode'])}
                    />
                    <div className="mt-4 space-y-2">
                      {SCENE_PRESETS.map((scene) => (
                        <button
                          key={scene.id}
                          onClick={() => updateScenePreset(scene.id)}
                          className={`w-full border px-4 py-3 text-left ${config.scenePreset === scene.id ? 'bg-[#1f1712] text-white' : 'bg-white text-[#523c30]'}`}
                        >
                          <div className="text-sm font-semibold">{scene.name}</div>
                          <div className={`mt-1 text-xs ${config.scenePreset === scene.id ? 'text-white/65' : 'text-[#7c6354]'}`}>{scene.mood}</div>
                        </button>
                      ))}
                    </div>
                    <ToggleRow label="Measurements" active={config.showMeasurements} onClick={toggleMeasurements} />
                    <ToggleRow label="Auto rotate" active={config.autoRotate} onClick={toggleAutoRotate} />
                    <ToggleRow label={`Mount: ${config.mountType}`} active={config.mountType === 'outside'} onClick={() => updateMountType(config.mountType === 'outside' ? 'inside' : 'outside')} />
                  </SectionCard>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {workflowStep === 'configure' && (
                      <ActionButton icon={<MdCameraAlt className="text-xl" />} title="Move To Live Preview" description="Check the current treatment against the live camera feed." onClick={() => setWorkflowStep('live')} />
                    )}
                    {workflowStep === 'live' && (
                      <ActionButton icon={<MdViewInAr className="text-xl" />} title="Move To AR Placement" description="Start placement review where the model stays locked after selection." onClick={() => setWorkflowStep('ar')} />
                    )}
                  </div>
                </div>
              )}

              {workflowStep === 'save' && (
                <div className="space-y-4">
                  <SectionCard title="Save Preview" icon={<MdSave className="text-xl" />}>
                    <TextInput label="Preview Name" value={previewName} onChange={setPreviewName} placeholder="Client master bedroom north window" />
                    <TextInput label="Area Label" value={areaLabel} onChange={setAreaLabel} placeholder="Bedroom / Living room / 1st floor" />
                    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <ActionButton icon={<MdSave className="text-xl" />} title="Save Preview" description="Store this preview under its job name and area." onClick={handleSavePreview} />
                      <ActionButton icon={<MdChecklist className="text-xl" />} title="Download Sheet" description="Export the current preview configuration as a text sheet." onClick={handleSpecDownload} />
                    </div>
                    <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <ActionButton icon={<MdDownload className="text-xl" />} title="Export Image" description="Download the current configured preview image." onClick={handleSnapshotDownload} />
                      <ActionButton icon={<MdContentCopy className="text-xl" />} title="Copy Share Link" description="Copy an internal link for reopening this configuration." onClick={handleShare} />
                    </div>
                  </SectionCard>

                  <SectionCard title="Saved Team Previews" icon={<MdPhotoLibrary className="text-xl" />}>
                    <div className="space-y-3">
                      {savedPreviews.length === 0 && (
                        <div className="border border-dashed border-[#d9c5b0] bg-[#fcf8f2] px-4 py-6 text-sm leading-6 text-[#6f5848]">
                          No previews saved yet. Complete a capture, configure it, and save it with a preview name and area.
                        </div>
                      )}

                      {savedPreviews.map((record) => (
                        <button
                          key={record.id}
                          onClick={() => handleRestorePreview(record)}
                          className="w-full border border-[#eadbc9] bg-[#fcfaf7] px-4 py-4 text-left transition hover:bg-[#f7ede1]"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="text-xs uppercase tracking-[0.24em] text-[#8e5d3f]">{record.areaLabel}</p>
                              <h3 className="mt-1 text-lg font-semibold text-[#251710]">{record.name}</h3>
                              <p className="mt-1 text-sm text-[#6f5848]">
                                {record.config.selectedProduct} / {getCurrentStyle(record.config)}
                              </p>
                            </div>
                            <div className="h-10 w-10 border border-[#eadbc9]" style={{ backgroundColor: record.config.color }} />
                          </div>
                          <p className="mt-3 text-xs uppercase tracking-[0.22em] text-[#8f7665]">{record.createdAt}</p>
                        </button>
                      ))}
                    </div>
                  </SectionCard>

                  <button
                    onClick={() => {
                      resetConfig();
                      setCapturedImage(null);
                      setCapturedFrame(null);
                      setWorkflowStep('capture');
                      showToast('Workflow reset', 'info');
                    }}
                    className="inline-flex w-full items-center justify-center gap-2 border border-[#1f1712] bg-[#1f1712] px-5 py-3 text-sm font-semibold text-white"
                  >
                    <MdOutlineRestartAlt className="text-lg" />
                    Start New Site Capture
                  </button>
                </div>
              )}
            </div>
          </div>
        </aside>

        <main className="order-1 xl:order-2">
          <div className="flex h-full flex-col border border-white/70 bg-white/35 p-3 backdrop-blur-xl xl:h-[calc(100dvh-1.5rem)]">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3 border border-[#d8c8b7] bg-white/65 px-4 py-3">
              <div>
                <p className="text-[0.68rem] uppercase tracking-[0.3em] text-[#8e5d3f]">Current Job</p>
                <h2 className="mt-1 font-serif text-2xl text-[#24160f] sm:text-3xl">
                  {previewName || 'Untitled employee preview'}
                </h2>
              </div>
              <div className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.18em] text-[#6a4d3b]">
                <Badge>{areaLabel || 'Area pending'}</Badge>
                <Badge>{selectedProduct.name}</Badge>
                <Badge>{currentStyle}</Badge>
                <Badge>{workflowStep}</Badge>
              </div>
            </div>

            <div className="min-h-[460px] flex-1">
              {workflowStep === 'capture' ? (
                <CaptureWorkspace onConfirmed={handleAreaConfirmed} />
              ) : (
                <Viewer
                  key={`${workflowStep}-${config.previewMode}`}
                  ref={viewerRef}
                  config={config}
                  mode={workflowStep === 'ar' ? 'ar' : workflowStep === 'live' ? 'live' : 'studio'}
                  capturedImage={capturedImage}
                />
              )}
            </div>

            {workflowStep === 'ar' && (
              <div className="mt-3 grid grid-cols-1 gap-3 border border-[#d8c8b7] bg-white/70 p-4 sm:grid-cols-[1fr_auto]">
                <p className="text-sm leading-6 text-[#5f4c40]">
                  In AR placement, the employee should tap the detected opening corners. Once the surface is locked, the model stays anchored while the phone moves around it. Adjustments can still be made from the left panel without dragging the model.
                </p>
                <button onClick={handleLaunchAR} className="border border-[#1f1712] bg-[#1f1712] px-5 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-white">
                  Start AR Placement
                </button>
              </div>
            )}
          </div>
        </main>
      </div>

      {toast && (
        <div className="pointer-events-none fixed bottom-4 right-3 left-3 z-50 border border-white/60 bg-white/88 px-5 py-3 text-center text-sm backdrop-blur-xl sm:left-auto sm:right-4 sm:text-left">
          <span className={toast.tone === 'success' ? 'text-[#215d3b]' : 'text-[#6a4d3b]'}>{toast.message}</span>
        </div>
      )}
    </div>
  );
}

function StepButton({
  label,
  active,
  enabled,
  onClick,
}: {
  label: string;
  active: boolean;
  enabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={!enabled}
      className={`min-h-[60px] border px-2 text-center text-[0.62rem] font-semibold uppercase tracking-[0.16em] ${
        active ? 'border-[#1f1712] bg-[#1f1712] text-white' : enabled ? 'border-[#d4c3b2] bg-white text-[#6a4d3b]' : 'border-[#e6d8c9] bg-[#f4ece3] text-[#a89280]'
      }`}
    >
      {label}
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
    <section className="border border-[#eadbc9] bg-[#fcfaf7] p-4">
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
    <button onClick={onClick} className="w-full border border-[#eadbc9] bg-white p-4 text-left transition hover:bg-[#f7ede1]">
      <div className="flex items-center gap-3 text-[#8e5d3f]">
        {icon}
        <span className="text-sm font-semibold uppercase tracking-[0.22em]">{title}</span>
      </div>
      <p className="mt-2 text-sm leading-6 text-[#6f5848]">{description}</p>
    </button>
  );
}

function Badge({ children }: { children: ReactNode }) {
  return <div className="border border-[#cfbca8] bg-[#f3e7d8] px-3 py-2">{children}</div>;
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
      <input type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} className="w-full accent-[#8e5d3f]" />
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
      <input type="number" min="0" value={value} onChange={(event) => onChange(Number(event.target.value))} className="mt-2 w-full border border-[#eadbc9] bg-white px-4 py-3 text-sm text-[#241913] outline-none" />
    </label>
  );
}

function TextInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label className="mt-3 block">
      <span className="text-xs uppercase tracking-[0.22em] text-[#7c6354]">{label}</span>
      <input type="text" value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="mt-2 w-full border border-[#eadbc9] bg-white px-4 py-3 text-sm text-[#241913] outline-none" />
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
    <div className="grid grid-cols-2 gap-2 border border-[#eadbc9] bg-[#f2e7d8] p-1">
      {options.map((option) => (
        <button key={option.value} onClick={() => onChange(option.value)} className={`px-3 py-2 text-sm font-semibold ${active === option.value ? 'bg-[#1f1712] text-white' : 'text-[#6a4d3b]'}`}>
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
    <button onClick={onClick} className="mt-3 flex w-full items-center justify-between border border-[#eadbc9] bg-white px-4 py-3 text-sm text-[#241913]">
      <span>{label}</span>
      <span className={`border px-3 py-1 text-[0.62rem] uppercase tracking-[0.24em] ${active ? 'border-[#1f1712] bg-[#1f1712] text-white' : 'border-[#e2d2c2] bg-[#f2e7d8] text-[#6a4d3b]'}`}>
        {active ? 'On' : 'Off'}
      </span>
    </button>
  );
}

function InfoLine({ label, text }: { label: string; text: string }) {
  return (
    <div className="mt-3 grid grid-cols-[30px_minmax(0,1fr)] gap-3 border border-dotted border-[#d8c8b7] p-3 text-sm leading-6 text-[#6a4d3b]">
      <div className="border border-[#d8c8b7] bg-white px-2 py-1 text-center font-semibold text-[#241913]">{label}</div>
      <p>{text}</p>
    </div>
  );
}

function CaptureWorkspace({ onConfirmed }: { onConfirmed: (image: string, frame: AreaFrame) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const imageWrapRef = useRef<HTMLDivElement>(null);
  const [cameraRequested, setCameraRequested] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [mirrorCamera, setMirrorCamera] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [points, setPoints] = useState<FramePoint[]>([]);

  useEffect(() => {
    if (!cameraRequested) {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      return;
    }

    let cancelled = false;

    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: false,
        });

        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        const [track] = stream.getVideoTracks();
        setMirrorCamera(track?.getSettings().facingMode === 'user');
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => undefined);
        }
        setCameraReady(true);
        setCameraError(null);
      } catch (error) {
        setCameraError(error instanceof Error ? error.message : 'Camera unavailable');
      }
    }

    startCamera();

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      setMirrorCamera(false);
    };
  }, [cameraRequested]);

  const handleCapture = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 1280;
    canvas.height = videoRef.current.videoHeight || 720;
    const context = canvas.getContext('2d');
    if (!context) return;
    if (mirrorCamera) {
      context.translate(canvas.width, 0);
      context.scale(-1, 1);
    }
    context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    setCapturedImage(canvas.toDataURL('image/jpeg', 0.92));
    setPoints([]);
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setPoints([]);
    setCameraRequested(true);
  };

  const handleImageClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!capturedImage || !imageWrapRef.current || points.length >= 4) return;
    const rect = imageWrapRef.current.getBoundingClientRect();
    const nextPoint = {
      x: (event.clientX - rect.left) / rect.width,
      y: (event.clientY - rect.top) / rect.height,
    };
    setPoints((prev) => [...prev, nextPoint]);
  };

  const handleAutoFit = () => {
    setPoints([
      { x: 0.14, y: 0.14 },
      { x: 0.86, y: 0.14 },
      { x: 0.86, y: 0.86 },
      { x: 0.14, y: 0.86 },
    ]);
  };

  const frame = useMemo<AreaFrame | null>(() => {
    if (points.length !== 4) return null;
    const xs = points.map((point) => point.x);
    const ys = points.map((point) => point.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);

    return {
      points,
      bounds: {
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY,
      },
    };
  }, [points]);

  return (
    <div className="flex h-full flex-col border border-[#d8c8b7] bg-[#f8f1e7]">
      <div className="grid gap-3 border-b border-[#d8c8b7] p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
        <div>
          <p className="text-[0.68rem] uppercase tracking-[0.3em] text-[#8e5d3f]">Step 1</p>
          <h2 className="mt-1 font-serif text-2xl text-[#24160f]">Capture and define the opening.</h2>
          <p className="mt-2 text-sm leading-6 text-[#5f4c40]">
            Take a site picture, tap the four best-fit corners manually, or use auto-fit to prepare the opening for configuration.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-1">
          {!capturedImage && !cameraRequested && (
            <button onClick={() => setCameraRequested(true)} className="border border-[#1f1712] bg-[#1f1712] px-5 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-white">
              Use Camera
            </button>
          )}
          {!capturedImage && (
            <button onClick={handleCapture} disabled={!cameraReady} className="border border-[#1f1712] bg-[#1f1712] px-5 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-white disabled:opacity-50">
              Take Picture
            </button>
          )}
          {capturedImage && (
            <>
              <button onClick={handleRetake} className="border border-[#1f1712] bg-white px-5 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-[#24160f]">
                Retake
              </button>
              <button onClick={handleAutoFit} className="border border-[#1f1712] bg-white px-5 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-[#24160f]">
                Auto-Fit
              </button>
            </>
          )}
        </div>
      </div>

      <div className="relative flex-1 bg-[#1b140f]">
        {!capturedImage && cameraRequested && (
          <>
            <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover" style={{ transform: mirrorCamera ? 'scaleX(-1)' : 'none' }} />
            {!cameraReady && !cameraError && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 px-6 text-center text-xs uppercase tracking-[0.24em] text-white/80 sm:text-sm">
                Opening camera for site capture
              </div>
            )}
            {cameraError && (
              <div className="absolute inset-0 flex items-center justify-center px-6 text-center text-sm text-white">
                Camera unavailable. Use a supported mobile browser/device for on-site capture.
              </div>
            )}
          </>
        )}

        {!capturedImage && !cameraRequested && (
          <div className="absolute inset-0 flex items-center justify-center px-6 text-center">
            <div className="max-w-xl border border-white/20 bg-black/35 px-6 py-8 text-white">
              <p className="text-[0.68rem] uppercase tracking-[0.3em] text-white/60">Capture Start</p>
              <h3 className="mt-3 font-serif text-3xl">Use camera when you are at the opening.</h3>
              <p className="mt-3 text-sm leading-6 text-white/75">
                The employee can review the area first, then press `Use Camera`, take the photo, and mark or auto-fit the four corners.
              </p>
            </div>
          </div>
        )}

        {capturedImage && (
          <div ref={imageWrapRef} className="relative h-full w-full cursor-crosshair" onClick={handleImageClick}>
            <img src={capturedImage} alt="Captured site opening" className="h-full w-full object-cover" />
            <svg className="absolute inset-0 h-full w-full">
              {points.length >= 2 && (
                <polyline
                  points={points.map((point) => `${point.x * 100},${point.y * 100}`).join(' ')}
                  fill="none"
                  stroke="#4ade80"
                  strokeWidth="0.6"
                  vectorEffect="non-scaling-stroke"
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                />
              )}
              {frame && (
                <polygon
                  points={points.map((point) => `${point.x * 100},${point.y * 100}`).join(' ')}
                  fill="rgba(74, 222, 128, 0.14)"
                  stroke="#4ade80"
                  strokeWidth="0.8"
                  vectorEffect="non-scaling-stroke"
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                />
              )}
            </svg>
            {points.map((point, index) => (
              <div
                key={`${point.x}-${point.y}-${index}`}
                className="absolute h-4 w-4 border-2 border-white bg-[#4ade80]"
                style={{ left: `calc(${point.x * 100}% - 8px)`, top: `calc(${point.y * 100}% - 8px)` }}
              />
            ))}
            <div className="absolute left-3 top-3 border border-white/60 bg-black/55 px-3 py-2 text-xs uppercase tracking-[0.2em] text-white">
              {points.length < 4 ? `Tap corners ${points.length + 1} / 4` : 'Area ready'}
            </div>
          </div>
        )}
      </div>

      <div className="grid gap-3 border-t border-[#d8c8b7] bg-white/70 p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
        <p className="text-sm leading-6 text-[#5f4c40]">
          The confirmed frame becomes the working opening for configuration and later locked AR placement. Employees can still change the product properties afterward without recapturing the site.
        </p>
        <button
          onClick={() => {
            if (capturedImage && frame) {
              onConfirmed(capturedImage, frame);
            }
          }}
          disabled={!capturedImage || !frame}
          className="border border-[#1f1712] bg-[#1f1712] px-5 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-white disabled:opacity-50"
        >
          Confirm Area
        </button>
      </div>
    </div>
  );
}
