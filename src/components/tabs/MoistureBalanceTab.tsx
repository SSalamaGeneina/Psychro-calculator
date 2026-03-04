import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../../store/useAppStore';
import { absoluteHumidity, enthalpy } from '../../lib/psychro';
import { computeEnergyBalance } from '../../lib/energyBalance';
import { computeMoistureBalance } from '../../lib/moistureBalance';
import { fmt2 } from '../../lib/formatting';
import SliderInput from '../shared/SliderInput';

export default function MoistureBalanceTab() {
  const { t } = useTranslation();
  const { zones, airPressure, energyBalance, moistureBalance, setMoistureBalance } = useAppStore();

  const ahOutside = useMemo(
    () => absoluteHumidity(zones.outside.temp, zones.outside.rh, airPressure),
    [zones.outside, airPressure]
  );
  const ahInside = useMemo(
    () => absoluteHumidity(zones.inside.temp, zones.inside.rh, airPressure),
    [zones.inside, airPressure]
  );

  const ventRate = useMemo(() => {
    const hOut = enthalpy(zones.outside.temp, zones.outside.rh, airPressure);
    const hIn = enthalpy(zones.inside.temp, zones.inside.rh, airPressure);
    const eb = computeEnergyBalance({
      solarRadiation: energyBalance.solarRadiation,
      radiationInsidePercent: energyBalance.radiationInside,
      uValue: energyBalance.uValue,
      tOutside: zones.outside.temp,
      tInside: zones.inside.temp,
      hOutside: hOut,
      hInside: hIn,
    });
    return eb.ventilationRate;
  }, [zones, airPressure, energyBalance]);

  const result = useMemo(
    () =>
      computeMoistureBalance({
        ventilationRate: isFinite(ventRate) ? ventRate : 0,
        ahInside,
        ahOutside,
        cropEvaporation: moistureBalance.cropEvaporation,
        foggingRate: moistureBalance.foggingRate,
      }),
    [ventRate, ahInside, ahOutside, moistureBalance]
  );

  const trendKey =
    result.trend === 'increase'
      ? 'moisture.resultIncrease'
      : result.trend === 'decrease'
        ? 'moisture.resultDecrease'
        : 'moisture.resultStable';

  const trendColor =
    result.trend === 'increase'
      ? 'text-red-600 bg-red-50'
      : result.trend === 'decrease'
        ? 'text-green-600 bg-green-50'
        : 'text-gray-600 bg-gray-50';

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      <h2 className="text-lg font-semibold text-gray-800">{t('moisture.title')}</h2>

      {/* Inputs */}
      <div className="space-y-3 bg-gray-50 rounded-lg p-4">
        <SliderInput
          label={t('moisture.cropEvaporation')}
          value={moistureBalance.cropEvaporation}
          min={0}
          max={1000}
          step={5}
          unit="g/m²·hr"
          onChange={(v) => setMoistureBalance('cropEvaporation', v)}
        />
        <SliderInput
          label={t('moisture.foggingRate')}
          value={moistureBalance.foggingRate}
          min={0}
          max={1000}
          step={5}
          unit="g/m²·hr"
          onChange={(v) => setMoistureBalance('foggingRate', v)}
        />
      </div>

      {/* Reference values */}
      <div className="grid grid-cols-3 gap-3 text-sm">
        <div className="bg-purple-50 rounded-lg p-3 text-center">
          <div className="text-purple-700 text-xs mb-1">{t('moisture.outsideAH')}</div>
          <div className="font-mono font-medium">{fmt2(ahOutside)} g/kg</div>
        </div>
        <div className="bg-blue-50 rounded-lg p-3 text-center">
          <div className="text-blue-700 text-xs mb-1">{t('moisture.insideAH')}</div>
          <div className="font-mono font-medium">{fmt2(ahInside)} g/kg</div>
        </div>
        <div className="bg-orange-50 rounded-lg p-3 text-center">
          <div className="text-orange-700 text-xs mb-1">{t('moisture.ventilationRate')}</div>
          <div className="font-mono font-medium">
            {isFinite(ventRate) ? fmt2(ventRate) : '∞'} kg/m²·hr
          </div>
        </div>
      </div>

      {/* Outputs */}
      <div className="border border-gray-200 rounded-lg divide-y divide-gray-200">
        <div className="flex justify-between items-center p-3">
          <span className="text-sm text-gray-600">{t('moisture.moistureRemoved')}</span>
          <span className="font-mono">{fmt2(result.moistureRemoved)} g/m²·hr</span>
        </div>
        <div className="flex justify-between items-center p-3">
          <span className="text-sm text-gray-600">{t('moisture.netBalance')}</span>
          <span className="font-mono font-medium">{fmt2(result.netBalance)} g/m²·hr</span>
        </div>
        <div className={`p-3 text-center font-medium ${trendColor}`}>{t(trendKey)}</div>
      </div>
    </div>
  );
}
