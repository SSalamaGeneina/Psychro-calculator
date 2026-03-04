import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../../store/useAppStore';
import { computeMoistureControl } from '../../lib/moistureControl';
import { fmt2 } from '../../lib/formatting';
import SliderInput from '../shared/SliderInput';

export default function MoistureControlTab() {
  const { t } = useTranslation();
  const { zones, airPressure, moistureControl, setMoistureControl } = useAppStore();

  const result = useMemo(
    () =>
      computeMoistureControl({
        greenhouseArea: moistureControl.greenhouseArea,
        capacity: moistureControl.capacity,
        pressureDiff: moistureControl.pressureDiff,
        efficiency: moistureControl.efficiency,
        outsideTemp: zones.outside.temp,
        outsideRH: zones.outside.rh,
        insideTemp: zones.inside.temp,
        insideRH: zones.inside.rh,
        cropTemp: moistureControl.cropTemp,
        cropRH: moistureControl.cropRH,
        cropHeight: moistureControl.cropHeight,
        airPressure,
      }),
    [zones, airPressure, moistureControl]
  );

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      <h2 className="text-lg font-semibold text-brand-teal">{t('mc.title')}</h2>

      {/* Fan section */}
      <div>
        <h3 className="text-sm font-semibold text-brand-teal mb-2">{t('mc.fanSection')}</h3>
        <div className="space-y-2 bg-brand-blue/20 rounded-lg p-4">
          <SliderInput label={t('mc.greenhouseArea')} value={moistureControl.greenhouseArea} min={0} max={1500} step={10} unit="m²" onChange={(v) => setMoistureControl('greenhouseArea', v)} />
          <SliderInput label={t('mc.capacity')} value={moistureControl.capacity} min={0} max={30} step={0.5} unit="m³/m²·hr" onChange={(v) => setMoistureControl('capacity', v)} />
          <SliderInput label={t('mc.pressureDiff')} value={moistureControl.pressureDiff} min={0} max={1000} step={10} unit="Pa" onChange={(v) => setMoistureControl('pressureDiff', v)} />
          <SliderInput label={t('mc.efficiency')} value={moistureControl.efficiency} min={0} max={100} step={1} unit="%" onChange={(v) => setMoistureControl('efficiency', v)} />
        </div>
        <div className="mt-3 border border-gray-200 rounded-lg divide-y divide-gray-200">
          <div className="flex justify-between p-3 text-sm">
            <span className="text-gray-600">{t('mc.totalFlow')}</span>
            <span className="font-mono">{fmt2(result.fan.totalFlow)} m³/hr</span>
          </div>
          <div className="flex justify-between p-3 text-sm">
            <span className="text-gray-600">{t('mc.fanPower')}</span>
            <span className="font-mono">{isFinite(result.fan.fanPower) ? fmt2(result.fan.fanPower) : '∞'} W</span>
          </div>
        </div>
      </div>

      {/* Heat Exchanger */}
      <div>
        <h3 className="text-sm font-semibold text-brand-teal mb-2">{t('mc.heatExchanger')}</h3>
        <div className="border border-gray-200 rounded-lg divide-y divide-gray-200">
          <div className="flex justify-between p-3 text-sm">
            <span className="text-gray-600">{t('mc.powerPerM2')}</span>
            <span className="font-mono">{fmt2(result.heatExchanger.powerPerM2)} W/m²</span>
          </div>
          <div className="flex justify-between p-3 text-sm">
            <span className="text-gray-600">{t('mc.electricalConsumption')}</span>
            <span className="font-mono">{fmt2(result.heatExchanger.electricalConsumption)} MJ/hr</span>
          </div>
        </div>
      </div>

      {/* Moisture Exhaust */}
      <div className="border border-gray-200 rounded-lg p-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600 font-medium">{t('mc.moistureExhaust')}</span>
          <span className="font-mono font-medium">{fmt2(result.moistureExhaust)} g/m²·hr</span>
        </div>
      </div>

      {/* Crop Conditions */}
      <div>
        <h3 className="text-sm font-semibold text-brand-teal mb-2">{t('mc.cropConditions')}</h3>
        <div className="space-y-2 bg-brand-blue/20 rounded-lg p-4">
          <SliderInput label={t('mc.cropTemp')} value={moistureControl.cropTemp} min={-20} max={50} step={0.1} unit="°C" onChange={(v) => setMoistureControl('cropTemp', v)} />
          <SliderInput label={t('mc.cropRH')} value={moistureControl.cropRH} min={0} max={100} step={1} unit="%" onChange={(v) => setMoistureControl('cropRH', v)} />
        </div>
        <div className="mt-3 border border-gray-200 rounded-lg p-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">{t('mc.cropAH')}</span>
            <span className="font-mono">{fmt2(result.cropAH)} g/kg</span>
          </div>
        </div>
      </div>

      {/* Moisture Transport */}
      <div>
        <h3 className="text-sm font-semibold text-brand-teal mb-2">{t('mc.moistureTransport')}</h3>
        <div className="space-y-2 bg-brand-blue/20 rounded-lg p-4">
          <SliderInput label={t('mc.cropHeight')} value={moistureControl.cropHeight} min={0.25} max={10} step={0.25} unit="m" onChange={(v) => setMoistureControl('cropHeight', v)} />
        </div>
        <div className="mt-3 border border-gray-200 rounded-lg divide-y divide-gray-200">
          <div className="flex justify-between p-3 text-sm">
            <span className="text-gray-600">{t('mc.diffusion')}</span>
            <span className="font-mono">{fmt2(result.diffusion)} g/m²·hr</span>
          </div>
          <div className="flex justify-between p-3 text-sm">
            <span className="text-gray-600">{t('mc.airMovement')}</span>
            <span className="font-mono">{fmt2(result.airMovement)} cm/s</span>
          </div>
          <div className="flex justify-between p-3 text-sm" style={{ backgroundColor: '#00c40012' }}>
            <span className="font-medium text-brand-teal">{t('mc.totalTransport')}</span>
            <span className="font-mono font-medium" style={{ color: '#00c400' }}>{fmt2(result.totalMoistureTransport)} g/m²·hr</span>
          </div>
        </div>
      </div>
    </div>
  );
}
