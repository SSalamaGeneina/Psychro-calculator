import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../../store/useAppStore';
import { absoluteHumidity, computeZoneProperties, computeDifferences, type ZoneProperties, type ZoneDifferences } from '../../lib/psychro';
import { fmt2, fmt1, fmtDiff2, fmtDiff1 } from '../../lib/formatting';
import SliderInput from './SliderInput';
import InfoTooltip from './InfoTooltip';
import { useMemo } from 'react';

const ZONE_KEYS = ['outside', 'aboveScreen', 'inside', 'plant'] as const;
const ZONE_COLORS: Record<string, string> = {
  outside: '#003d48',
  aboveScreen: '#0b6f1d',
  inside: '#0077a8',
  plant: '#DB7B2B',
};
const DIFF_COLOR = '#DB7B2B';
const CHART_T_MIN = -10;
const CHART_T_MAX = 55;
const CHART_AH_MIN = 0;
const CHART_AH_MAX = 30;

interface PropertyRow {
  key: string;
  labelKey: string;
  unitKey: string;
  propField: keyof ZoneProperties;
  diffField: keyof ZoneDifferences;
  format: (v: number) => string;
  diffFormat: (v: number) => string;
}

const STANDARD_ROWS: PropertyRow[] = [
  { key: 'ah', labelKey: 'outputs.ah', unitKey: 'outputs.ahUnit', propField: 'ah', diffField: 'ah', format: fmt2, diffFormat: fmtDiff2 },
  { key: 'hd', labelKey: 'outputs.hd', unitKey: 'outputs.hdUnit', propField: 'hd', diffField: 'hd', format: fmt2, diffFormat: fmtDiff2 },
  { key: 'h', labelKey: 'outputs.h', unitKey: 'outputs.hUnit', propField: 'h', diffField: 'h', format: fmt2, diffFormat: fmtDiff2 },
  { key: 'vpd', labelKey: 'outputs.vpd', unitKey: 'outputs.vpdUnit', propField: 'vpd', diffField: 'vpd', format: fmt2, diffFormat: fmtDiff2 },
  { key: 'vp', labelKey: 'outputs.vp', unitKey: 'outputs.vpUnit', propField: 'vp', diffField: 'vp', format: fmt2, diffFormat: fmtDiff2 },
  { key: 'vpsat', labelKey: 'outputs.vpsat', unitKey: 'outputs.vpsatUnit', propField: 'vpsat', diffField: 'vpsat', format: fmt2, diffFormat: fmtDiff2 },
  { key: 'tdp', labelKey: 'outputs.tdp', unitKey: 'outputs.tdpUnit', propField: 'tdp', diffField: 'tdp', format: fmt1, diffFormat: fmtDiff1 },
];

export default function ZoneTable() {
  const { t } = useTranslation();
  const { airPressure, zones, ui, setZoneTemp, setZoneRH } = useAppStore();

  const computed = useMemo(() => {
    const result: Record<string, ZoneProperties> = {};
    for (const key of ZONE_KEYS) {
      result[key] = computeZoneProperties(zones[key].temp, zones[key].rh, airPressure, ui.moreInfo);
    }
    return result;
  }, [zones, airPressure, ui.moreInfo]);

  const diffs = useMemo(() => {
    const pairs: [typeof ZONE_KEYS[number], typeof ZONE_KEYS[number]][] = [
      ['outside', 'aboveScreen'],
      ['aboveScreen', 'inside'],
      ['inside', 'plant'],
    ];
    return pairs.map(([l, r]) =>
      computeDifferences(zones[l].temp, zones[l].rh, computed[l], zones[r].temp, zones[r].rh, computed[r])
    );
  }, [zones, computed]);

  const extendedRows: PropertyRow[] = ui.moreInfo
    ? [
        { key: 'ahVol', labelKey: 'outputs.ah', unitKey: 'outputs.ahVolUnit', propField: 'ahVol' as keyof ZoneProperties, diffField: 'ah', format: fmt2, diffFormat: fmtDiff2 },
        { key: 'hdVol', labelKey: 'outputs.hd', unitKey: 'outputs.hdVolUnit', propField: 'hdVol' as keyof ZoneProperties, diffField: 'hd', format: fmt2, diffFormat: fmtDiff2 },
        { key: 'hVol', labelKey: 'outputs.h', unitKey: 'outputs.hVolUnit', propField: 'hVol' as keyof ZoneProperties, diffField: 'h', format: fmt2, diffFormat: fmtDiff2 },
      ]
    : [];

  const allRows = [...STANDARD_ROWS, ...extendedRows];

  const outOfRangeZones = useMemo(() => {
    return ZONE_KEYS.filter((zone) => {
      const z = zones[zone];
      const ah = absoluteHumidity(z.temp, z.rh, airPressure);
      return z.temp < CHART_T_MIN || z.temp > CHART_T_MAX || ah < CHART_AH_MIN || ah > CHART_AH_MAX;
    });
  }, [zones, airPressure]);

  return (
    <div className="overflow-x-auto">
      {outOfRangeZones.length > 0 && (
        <div className="mb-2 text-xs text-brand-orange bg-brand-orange/10 border border-brand-orange/30 rounded-md p-2">
          {t('chart.outOfRangeWarning', {
            zones: outOfRangeZones.map((zone) => t(`zones.${zone}`)).join(', '),
          })}
        </div>
      )}
      <table className="w-full text-xs border-collapse min-w-[800px]">
        <thead>
          <tr>
            {ZONE_KEYS.map((zone, i) => (
              <React.Fragment key={zone}>
                <th
                  className="px-2 py-1.5 text-white font-semibold text-center"
                  style={{ backgroundColor: ZONE_COLORS[zone] }}
                >
                  {t(`zones.${zone}`)}
                  {outOfRangeZones.includes(zone) && (
                    <div className="text-[10px] font-medium mt-0.5 opacity-90">
                      {t('chart.outOfRangeShort')}
                    </div>
                  )}
                </th>
                {i < ZONE_KEYS.length - 1 && (
                  <th
                    className="px-1 py-1.5 text-white font-semibold text-center w-16"
                    style={{ backgroundColor: DIFF_COLOR, opacity: 0.85 }}
                  >
                    {t('zones.diff')}
                  </th>
                )}
              </React.Fragment>
            ))}
          </tr>
        </thead>
        <tbody>
          {/* Temperature row */}
          <tr className="bg-gray-50">
            {ZONE_KEYS.map((zone, i) => (
              <React.Fragment key={zone}>
                <td className="px-2 py-1 border border-gray-200">
                  <SliderInput
                    label="T"
                    value={zones[zone].temp}
                    min={-20}
                    max={50}
                    step={0.1}
                    unit="°C"
                    onChange={(v) => setZoneTemp(zone, v)}
                    color={ZONE_COLORS[zone]}
                  />
                </td>
                {i < ZONE_KEYS.length - 1 && (
                  <td className="px-1 py-1 text-center border border-gray-200 font-mono" style={{ color: DIFF_COLOR }}>
                    {fmtDiff1(diffs[i].temp)}
                  </td>
                )}
              </React.Fragment>
            ))}
          </tr>
          {/* RH row */}
          <tr>
            {ZONE_KEYS.map((zone, i) => (
              <React.Fragment key={zone}>
                <td className="px-2 py-1 border border-gray-200">
                  <SliderInput
                    label="RH"
                    value={zones[zone].rh}
                    min={0}
                    max={100}
                    step={1}
                    unit="%"
                    onChange={(v) => setZoneRH(zone, v)}
                    color={ZONE_COLORS[zone]}
                  />
                </td>
                {i < ZONE_KEYS.length - 1 && (
                  <td className="px-1 py-1 text-center border border-gray-200 font-mono" style={{ color: DIFF_COLOR }}>
                    {fmtDiff1(diffs[i].rh)}
                  </td>
                )}
              </React.Fragment>
            ))}
          </tr>
          {/* Property rows */}
          {allRows.map((row) => (
            <tr key={row.key} className={row.key.includes('Vol') ? 'bg-brand-blue/30' : ''}>
              {ZONE_KEYS.map((zone, i) => {
                const val = computed[zone][row.propField];
                return (
                  <React.Fragment key={zone}>
                    <td className="px-2 py-1 border border-gray-200">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">{t(row.labelKey)}</span>
                        <span className="flex items-center gap-1">
                          <span className="font-mono font-medium">
                            {val !== undefined && val !== null ? row.format(val) : '—'}
                          </span>
                          <span className="text-gray-400">{t(row.unitKey)}</span>
                          {zone === 'plant' && !row.key.includes('Vol') && (
                            <InfoTooltip text={t(`info.${row.key}`)} />
                          )}
                        </span>
                      </div>
                    </td>
                    {i < ZONE_KEYS.length - 1 && (
                      <td className="px-1 py-1 text-center border border-gray-200 font-mono" style={{ color: DIFF_COLOR }}>
                        {typeof diffs[i][row.diffField] === 'number'
                          ? row.diffFormat(diffs[i][row.diffField] as number)
                          : '—'}
                      </td>
                    )}
                  </React.Fragment>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
