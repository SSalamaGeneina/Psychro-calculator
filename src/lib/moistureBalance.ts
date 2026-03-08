export interface MoistureBalanceInputs {
  ventilationRate: number | null;
  ahInside: number;
  ahOutside: number;
  cropEvaporation: number;
  foggingRate: number;
}

export type MoistureTrend = 'increase' | 'decrease' | 'stable';
export type MoistureBalanceStatus = 'ok' | 'cannotCompute';

export interface MoistureBalanceResult {
  moistureRemoved: number | null;
  netBalance: number | null;
  trend: MoistureTrend | null;
  status: MoistureBalanceStatus;
}

export const STABLE_NET_BALANCE_BAND = 2; // g/m2.hr

export function computeMoistureBalance(inputs: MoistureBalanceInputs): MoistureBalanceResult {
  if (
    inputs.ventilationRate === null ||
    !isFinite(inputs.ventilationRate) ||
    inputs.ventilationRate < 0
  ) {
    return {
      moistureRemoved: null,
      netBalance: null,
      trend: null,
      status: 'cannotCompute',
    };
  }

  const moistureRemoved = inputs.ventilationRate * (inputs.ahInside - inputs.ahOutside);
  const netBalance = inputs.cropEvaporation + inputs.foggingRate - moistureRemoved;

  let trend: MoistureTrend;
  if (Math.abs(netBalance) <= STABLE_NET_BALANCE_BAND) {
    trend = 'stable';
  } else if (netBalance > 0) {
    trend = 'increase';
  } else {
    trend = 'decrease';
  }

  return { moistureRemoved, netBalance, trend, status: 'ok' };
}
