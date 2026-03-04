export interface EnergyBalanceInputs {
  solarRadiation: number;
  radiationInsidePercent: number;
  uValue: number;
  tOutside: number;
  tInside: number;
  hOutside: number;
  hInside: number;
}

export interface EnergyBalanceResult {
  qSolar: number;
  qWallLoss: number;
  qNet: number;
  ventilationRate: number;
}

export function computeEnergyBalance(inputs: EnergyBalanceInputs): EnergyBalanceResult {
  const qSolar = inputs.solarRadiation * (inputs.radiationInsidePercent / 100.0);
  const qWallLoss = inputs.uValue * (inputs.tInside - inputs.tOutside);
  const qNet = qSolar - qWallLoss;

  const dH = inputs.hInside - inputs.hOutside;
  const ventilationRate = dH <= 0 ? Infinity : (qNet * 3.6) / dH;

  return { qSolar, qWallLoss, qNet, ventilationRate };
}
