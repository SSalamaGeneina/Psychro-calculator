import { useTranslation } from 'react-i18next';
import { useAppStore } from '../../store/useAppStore';
import PsychroCanvas from '../chart/PsychroCanvas';
import ZoneTable from '../shared/ZoneTable';
import SliderInput from '../shared/SliderInput';

export default function PsychroDiagramTab() {
  const { t } = useTranslation();
  const { airPressure, ui, setAirPressure, toggleShowChart, toggleMoreInfo } = useAppStore();

  return (
    <div className="space-y-4 p-4">
      {/* Controls bar */}
      <div className="flex flex-wrap items-center gap-4">
        <button
          onClick={toggleShowChart}
          className="px-3 py-1.5 text-sm font-medium border border-brand-teal/30 text-brand-teal rounded-md hover:bg-brand-blue/30 transition-colors"
        >
          {ui.showChart ? t('chart.hide') : t('chart.show')}
        </button>
        <label className="flex items-center gap-2 text-sm cursor-pointer text-brand-teal">
          <input
            type="checkbox"
            checked={ui.moreInfo}
            onChange={toggleMoreInfo}
            className="rounded border-gray-300 accent-brand-green"
          />
          {t('chart.moreInfo')}
        </label>
        <div className="flex-1 min-w-[200px] max-w-[400px]">
          <SliderInput
            label="AP"
            value={airPressure}
            min={500}
            max={1250}
            step={1}
            unit="hPa"
            onChange={setAirPressure}
          />
        </div>
      </div>

      {/* Psychrometric Chart */}
      {ui.showChart && (
        <div className="rounded-lg overflow-hidden">
          <PsychroCanvas />
        </div>
      )}

      {/* Zone Data Table */}
      <ZoneTable />
    </div>
  );
}
