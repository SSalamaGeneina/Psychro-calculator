export interface EnergyBalanceInputs {
  solarRadiation: number;
  radiationInsidePercent: number;
  uValue: number;
  tOutside: number;
  tInside: number;
  hOutside: number;
  hInside: number;
}

export type VentilationStatus = 'ok' | 'notSolvable' | 'noVentilationNeeded';

export interface EnergyBalanceResult {
  qSolar: number;
  qWallLoss: number;
  qNet: number;
  dH: number;
  ventilationRate: number | null;
  status: VentilationStatus;
}

export function computeEnergyBalance(inputs: EnergyBalanceInputs): EnergyBalanceResult {
  const qSolar = inputs.solarRadiation * (inputs.radiationInsidePercent / 100.0);
  const qWallLoss = inputs.uValue * (inputs.tInside - inputs.tOutside);
  const qNet = qSolar - qWallLoss;

  const dH = inputs.hInside - inputs.hOutside;
  if (qNet <= 0) {
    return { qSolar, qWallLoss, qNet, dH, ventilationRate: 0, status: 'noVentilationNeeded' };
  }

  if (dH <= 0 || !isFinite(dH)) {
    return { qSolar, qWallLoss, qNet, dH, ventilationRate: null, status: 'notSolvable' };
  }

  const ventilationRate = Math.max(0, (qNet * 3.6) / dH);

  return { qSolar, qWallLoss, qNet, dH, ventilationRate, status: 'ok' };
}
