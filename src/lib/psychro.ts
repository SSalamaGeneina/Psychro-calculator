/**
 * Core psychrometric calculation engine.
 * All formulas validated against LetsGrow.com GPE Psychro v3.1 reference.
 * Tetens over-water formula used universally (including sub-zero) per PRD.
 */

export function saturationVaporPressure(T: number): number {
  return 0.61078 * Math.exp((17.27 * T) / (T + 237.3));
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
  return (622.0 * vp) / (P_kPa - vp);
}

export function humidityDeficit(T: number, RH: number, P_hPa: number): number {
  return absoluteHumidity(T, 100, P_hPa) - absoluteHumidity(T, RH, P_hPa);
}

export function enthalpy(T: number, RH: number, P_hPa: number): number {
  const w = absoluteHumidity(T, RH, P_hPa) / 1000.0;
  return 1.006 * T + w * (2501.0 + 1.86 * T);
}

export function dewPoint(T: number, RH: number): number {
  const vp = vaporPressure(T, RH);
  if (vp <= 0) return -273.15;
  const alpha = Math.log(vp / 0.61078);
  return (237.3 * alpha) / (17.27 - alpha);
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
  tdp: number;
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
  tdp: number;
}

export function computeDifferences(
  leftT: number,
  leftRH: number,
  leftProps: ZoneProperties,
  rightT: number,
  rightRH: number,
  rightProps: ZoneProperties
): ZoneDifferences {
  return {
    temp: rightT - leftT,
    rh: rightRH - leftRH,
    ah: rightProps.ah - leftProps.ah,
    hd: rightProps.hd - leftProps.hd,
    h: rightProps.h - leftProps.h,
    vpd: rightProps.vpd - leftProps.vpd,
    vp: rightProps.vp - leftProps.vp,
    vpsat: rightProps.vpsat - leftProps.vpsat,
    tdp: rightProps.tdp - leftProps.tdp,
  };
}
