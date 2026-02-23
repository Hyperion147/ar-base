import { MdPhotoCamera, MdShare, MdDownload, MdSettings, MdHistory, MdTune } from 'react-icons/md';

interface SettingsTabProps {
  showMeasurements: boolean;
  onToggleMeasurements: () => void;
  isViewLocked: boolean;
  onToggleViewLock: () => void;
}

export const SettingsTab = ({
  showMeasurements,
  onToggleMeasurements,
  isViewLocked,
  onToggleViewLock
}: SettingsTabProps) => {
  return (
    <div className="flex flex-col gap-10">
      {/* Visual Settings */}
      <div>
        <div className="flex items-center gap-2 mb-6">
          <div className="w-1 h-4 bg-[#667eea]" />
          <h3 className="text-xs font-bold text-gray-900 uppercase tracking-[0.2em]">
            Experience Settings
          </h3>
        </div>

        <div className="space-y-2 bg-gray-50 border border-gray-100 p-2">
          <ToggleItem
            label="Show Measurements"
            description="Display real-world dimensions on the model"
            checked={showMeasurements}
            onChange={onToggleMeasurements}
            icon={<MdTune className="text-[#667eea]" />}
          />
          <ToggleItem
            label="Lock 3D View"
            description="Disable camera rotation for precise control"
            checked={isViewLocked}
            onChange={onToggleViewLock}
            icon={<MdSettings className="text-[#667eea]" />}
          />
          <ToggleItem
            label="High Precision"
            description="Use ultra-sharp textures and shadows"
            checked={true}
            onChange={() => { }}
            icon={<MdSettings className="text-[#667eea]" />}
          />
          <ToggleItem
            label="Auto-Rotation"
            description="Continuously rotate the preview model"
            checked={false}
            onChange={() => { }}
            icon={<MdHistory className="text-[#667eea]" />}
          />
        </div>
      </div>

      {/* Export Section */}
      <div>
        <div className="flex items-center gap-2 mb-6">
          <div className="w-1 h-4 bg-[#667eea]" />
          <h3 className="text-xs font-bold text-gray-900 uppercase tracking-[0.2em]">
            Export & Actions
          </h3>
        </div>

        <div className="grid grid-cols-1 gap-3">
          <button className="group relative w-full py-4 px-6 bg-white border-2 border-gray-100
                           text-sm font-bold uppercase tracking-widest flex items-center justify-between
                           hover:border-[#667eea] hover:shadow-xl transition-all duration-300 overflow-hidden">
            <div className="flex items-center gap-3">
              <MdPhotoCamera className="text-xl text-gray-400 group-hover:text-[#667eea]" />
              <span className="text-gray-600 group-hover:text-gray-900">Render Snapshot</span>
            </div>
            <div className="w-1.5 h-1.5 bg-indigo-200 group-hover:bg-[#667eea] transition-colors" />
          </button>

          <button className="group relative w-full py-4 px-6 bg-white border-2 border-gray-100
                           text-sm font-bold uppercase tracking-widest flex items-center justify-between
                           hover:border-[#667eea] hover:shadow-xl transition-all duration-300 overflow-hidden">
            <div className="flex items-center gap-3">
              <MdShare className="text-xl text-gray-400 group-hover:text-[#667eea]" />
              <span className="text-gray-600 group-hover:text-gray-900">Share Config</span>
            </div>
            <div className="w-1.5 h-1.5 bg-indigo-200 group-hover:bg-[#667eea] transition-colors" />
          </button>

          <button className="group relative w-full py-4 px-6 bg-gray-900 border-2 border-gray-900
                           text-white text-sm font-bold uppercase tracking-widest flex items-center justify-between
                           hover:bg-gray-800 transition-all duration-300">
            <div className="flex items-center gap-3">
              <MdDownload className="text-xl text-[#667eea]" />
              <span>Download Specs (PDF)</span>
            </div>
          </button>
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-4 p-4 border-t border-gray-100 text-center">
        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
          Version 2.4.0-build.82
        </p>
      </div>
    </div>
  );
};

// Toggle Component
interface ToggleItemProps {
  label: string;
  description: string;
  checked: boolean;
  onChange: () => void;
  icon: React.ReactNode;
}

const ToggleItem = ({ label, description, checked, onChange, icon }: ToggleItemProps) => (
  <div className="flex justify-between items-center p-4 bg-white border border-transparent hover:border-indigo-100 transition-all duration-300">
    <div className="flex items-center gap-4">
      <div className="w-8 h-8 flex items-center justify-center bg-indigo-50/50">
        {icon}
      </div>
      <div className="flex flex-col">
        <label className="text-[11px] font-black text-gray-900 uppercase tracking-widest leading-none mb-1">
          {label}
        </label>
        <p className="text-[10px] text-gray-400 font-medium">{description}</p>
      </div>
    </div>

    <button
      onClick={onChange}
      className={`
        relative w-12 h-6 transition-all duration-500 ease-in-out
        ${checked ? 'bg-[#667eea]' : 'bg-gray-200'}
      `}
    >
      <div className={`
        absolute top-1 left-1 w-4 h-4 bg-white shadow-md transition-all duration-500
        ${checked ? 'translate-x-6' : 'translate-x-0'}
      `} />
    </button>
  </div>
);

