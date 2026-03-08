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

  const energyResult = useMemo(() => {
    const hOut = enthalpy(zones.outside.temp, zones.outside.rh, airPressure);
    const hIn = enthalpy(zones.inside.temp, zones.inside.rh, airPressure);
    return computeEnergyBalance({
      solarRadiation: energyBalance.solarRadiation,
      radiationInsidePercent: energyBalance.radiationInside,
      uValue: energyBalance.uValue,
      tOutside: zones.outside.temp,
      tInside: zones.inside.temp,
      hOutside: hOut,
      hInside: hIn,
    });
  }, [zones, airPressure, energyBalance]);

  const ventRate = energyResult.status === 'notSolvable' ? null : energyResult.ventilationRate;

  const result = useMemo(
    () =>
      computeMoistureBalance({
        ventilationRate: ventRate,
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
      ? 'text-brand-orange bg-brand-orange/10'
      : result.trend === 'decrease'
        ? 'text-brand-green bg-brand-green/10'
        : 'text-gray-600 bg-gray-50';

  const ventStatusLabel =
    energyResult.status === 'ok'
      ? `${fmt2(ventRate ?? 0)} ${t('energy.ventilationRateUnit')}`
      : energyResult.status === 'noVentilationNeeded'
        ? t('energy.statusNoVentilationNeeded')
        : t('energy.statusNotSolvable');

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      <h2 className="text-lg font-semibold text-brand-teal">{t('moisture.title')}</h2>

      <div className="space-y-3 bg-brand-blue/20 rounded-lg p-4">
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

      <div className="grid grid-cols-3 gap-3 text-sm">
        <div className="bg-brand-teal/5 border border-brand-teal/20 rounded-lg p-3 text-center">
          <div className="text-brand-teal text-xs mb-1">{t('moisture.outsideAH')}</div>
          <div className="font-mono font-medium">{fmt2(ahOutside)} {t('outputs.ahUnit')}</div>
        </div>
        <div className="bg-brand-blue/30 border border-brand-blue rounded-lg p-3 text-center">
          <div className="text-brand-teal text-xs mb-1">{t('moisture.insideAH')}</div>
          <div className="font-mono font-medium">{fmt2(ahInside)} {t('outputs.ahUnit')}</div>
        </div>
        <div className="bg-brand-orange/10 border border-brand-orange/30 rounded-lg p-3 text-center">
          <div className="text-brand-orange text-xs mb-1">{t('moisture.ventilationRate')}</div>
          <div className="font-mono font-medium">{ventStatusLabel}</div>
        </div>
      </div>

      <div className="border border-gray-200 rounded-lg divide-y divide-gray-200">
        <div className="flex justify-between items-center p-3">
          <span className="text-sm text-gray-600">{t('moisture.moistureRemoved')}</span>
          <span className="font-mono">
            {result.moistureRemoved === null ? '—' : `${fmt2(result.moistureRemoved)} g/m²·hr`}
          </span>
        </div>
        <div className="flex justify-between items-center p-3">
          <span className="text-sm text-gray-600">{t('moisture.netBalance')}</span>
          <span className="font-mono font-medium">
            {result.netBalance === null ? '—' : `${fmt2(result.netBalance)} g/m²·hr`}
          </span>
        </div>
        {result.status === 'ok' ? (
          <div className={`p-3 text-center font-medium ${trendColor}`}>{t(trendKey)}</div>
        ) : (
          <div className="p-3 text-center text-sm font-medium text-brand-orange bg-brand-orange/10">
            {t('moisture.cannotComputeTrend')}
          </div>
        )}
      </div>
    </div>
  );
}
