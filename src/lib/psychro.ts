/**
 * Core psychrometric calculation engine.
 * Saturation pressure uses a temperature-branch Buck model:
 * - over ice for T < 0 C
 * - over water for T >= 0 C
 */

export function saturationVaporPressure(T: number): number {
  if (T < 0) {
    // Buck (1981), valid and stable for sub-zero conditions.
    return 0.61115 * Math.exp((23.036 - T / 333.7) * (T / (279.82 + T)));
  }
  // Buck (1981), over-liquid-water branch.
  return 0.61121 * Math.exp((18.678 - T / 234.5) * (T / (257.14 + T)));
}

export function vaporPressure(T: number, RH: number): number {
  return (RH / 100) * saturationVaporPressure(T);
}

export function vaporPressureDeficit(T: number, RH: number): number {
  return saturationVaporPressure(T) - vaporPressure(T, RH);
}

export function absoluteHumidity(T: number, RH: number, P_hPa: number): number {
  const vp = vaporPressure(T, RH);
  const P_kPa = P_hPa / 10.0;
  if (vp <= 0) return 0;
  if (vp >= P_kPa) return Infinity;
  return (622.0 * vp) / (P_kPa - vp);
}

export function humidityDeficit(T: number, RH: number, P_hPa: number): number {
  return absoluteHumidity(T, 100, P_hPa) - absoluteHumidity(T, RH, P_hPa);
}

export function enthalpy(T: number, RH: number, P_hPa: number): number {
  const w = absoluteHumidity(T, RH, P_hPa) / 1000.0;
  return 1.006 * T + w * (2501.0 + 1.86 * T);
}

export function dewPoint(T: number, RH: number): number | null {
  if (RH <= 0) return null;
  const vp = vaporPressure(T, RH);
  if (!isFinite(vp) || vp <= 0) return null;

  // Numerically invert saturation curve to support both water/ice branches.
  let lo = -100;
  let hi = 100;
  if (vp <= saturationVaporPressure(lo)) return lo;
  if (vp >= saturationVaporPressure(hi)) return hi;

  for (let i = 0; i < 60; i += 1) {
    const mid = (lo + hi) / 2;
    if (saturationVaporPressure(mid) > vp) {
      hi = mid;
    } else {
      lo = mid;
    }
  }
  return (lo + hi) / 2;
}

export function moistAirDensity(T: number, RH: number, P_hPa: number): number {
  const w = absoluteHumidity(T, RH, P_hPa) / 1000.0;
  const T_virtual = (T + 273.15) * (1 + 0.608 * w);
  const P_Pa = P_hPa * 100.0;
  return P_Pa / (287.05 * T_virtual);
}

export interface ZoneProperties {
  ah: number;
  hd: number;
  h: number;
  vpd: number;
  vp: number;
  vpsat: number;
  tdp: number | null;
  ahVol?: number;
  hdVol?: number;
  hVol?: number;
}

export function computeZoneProperties(
  T: number,
  RH: number,
  P_hPa: number,
  extended: boolean = false
): ZoneProperties {
  const ah = absoluteHumidity(T, RH, P_hPa);
  const hd = humidityDeficit(T, RH, P_hPa);
  const h = enthalpy(T, RH, P_hPa);
  const vpd = vaporPressureDeficit(T, RH);
  const vp = vaporPressure(T, RH);
  const vpsat = saturationVaporPressure(T);
  const tdp = dewPoint(T, RH);

  const props: ZoneProperties = { ah, hd, h, vpd, vp, vpsat, tdp };

  if (extended) {
    const rho = moistAirDensity(T, RH, P_hPa);
    props.ahVol = ah * rho;
    props.hdVol = hd * rho;
    props.hVol = h * rho;
  }

  return props;
}

export interface ZoneDifferences {
  temp: number;
  rh: number;
  ah: number;
  hd: number;
  h: number;
  vpd: number;
  vp: number;
  vpsat: number;
  tdp: number | null;
}

export function computeDifferences(
  leftT: number,
  leftRH: number,
  leftProps: ZoneProperties,
  rightT: number,
  rightRH: number,
  rightProps: ZoneProperties
): ZoneDifferences {
  const tdpDiff =
    leftProps.tdp === null || rightProps.tdp === null ? null : rightProps.tdp - leftProps.tdp;

  return {
    temp: rightT - leftT,
    rh: rightRH - leftRH,
    ah: rightProps.ah - leftProps.ah,
    hd: rightProps.hd - leftProps.hd,
    h: rightProps.h - leftProps.h,
    vpd: rightProps.vpd - leftProps.vpd,
    vp: rightProps.vp - leftProps.vp,
    vpsat: rightProps.vpsat - leftProps.vpsat,
    tdp: tdpDiff,
  };
}
