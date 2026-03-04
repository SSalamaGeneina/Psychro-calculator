import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../../store/useAppStore';
import { enthalpy } from '../../lib/psychro';
import { computeEnergyBalance } from '../../lib/energyBalance';
import { fmt2 } from '../../lib/formatting';
import SliderInput from '../shared/SliderInput';

export default function EnergyBalanceTab() {
  const { t } = useTranslation();
  const { zones, airPressure, energyBalance, setEnergyBalance } = useAppStore();

  const hOutside = useMemo(
    () => enthalpy(zones.outside.temp, zones.outside.rh, airPressure),
    [zones.outside, airPressure]
  );
  const hInside = useMemo(
    () => enthalpy(zones.inside.temp, zones.inside.rh, airPressure),
    [zones.inside, airPressure]
  );

  const result = useMemo(
    () =>
      computeEnergyBalance({
        solarRadiation: energyBalance.solarRadiation,
        radiationInsidePercent: energyBalance.radiationInside,
        uValue: energyBalance.uValue,
        tOutside: zones.outside.temp,
        tInside: zones.inside.temp,
        hOutside,
        hInside,
      }),
    [energyBalance, zones.outside.temp, zones.inside.temp, hOutside, hInside]
  );

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      <h2 className="text-lg font-semibold text-gray-800">{t('energy.title')}</h2>

      {/* Inputs */}
      <div className="space-y-3 bg-gray-50 rounded-lg p-4">
        <SliderInput
          label={t('energy.solarRadiation')}
          value={energyBalance.solarRadiation}
          min={0}
          max={1250}
          step={10}
          unit="W/m²"
          onChange={(v) => setEnergyBalance('solarRadiation', v)}
        />
        <SliderInput
          label={t('energy.radiationInside')}
          value={energyBalance.radiationInside}
          min={0}
          max={100}
          step={1}
          unit="%"
          onChange={(v) => setEnergyBalance('radiationInside', v)}
        />
        <SliderInput
          label={t('energy.uValue')}
          value={energyBalance.uValue}
          min={0}
          max={25}
          step={0.5}
          unit="W/m²·K"
          onChange={(v) => setEnergyBalance('uValue', v)}
        />
      </div>

      {/* Reference values from Psychro tab */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="bg-purple-50 rounded-lg p-3">
          <div className="text-purple-700 font-medium mb-1">{t('energy.outsideTemp')}</div>
          <div className="font-mono text-lg">{zones.outside.temp} °C</div>
          <div className="text-gray-500 mt-1">
            {t('energy.outsideEnthalpy')}: <span className="font-mono">{fmt2(hOutside)}</span> kJ/kg
          </div>
        </div>
        <div className="bg-blue-50 rounded-lg p-3">
          <div className="text-blue-700 font-medium mb-1">{t('energy.insideTemp')}</div>
          <div className="font-mono text-lg">{zones.inside.temp} °C</div>
          <div className="text-gray-500 mt-1">
            {t('energy.insideEnthalpy')}: <span className="font-mono">{fmt2(hInside)}</span> kJ/kg
          </div>
        </div>
      </div>

      {/* Outputs */}
      <div className="border border-gray-200 rounded-lg divide-y divide-gray-200">
        <div className="flex justify-between items-center p-3">
          <span className="text-sm text-gray-600">{t('energy.energyInput')}</span>
          <span className="font-mono font-medium">{fmt2(result.qSolar)} W/m²</span>
        </div>
        <div className="flex justify-between items-center p-3 bg-green-50">
          <span className="text-sm font-medium text-green-800">{t('energy.ventilationRate')}</span>
          <span className="font-mono font-bold text-green-700">
            {isFinite(result.ventilationRate) ? fmt2(result.ventilationRate) : '∞'} kg/m²·hr
          </span>
        </div>
      </div>
    </div>
  );
}
