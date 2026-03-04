export interface MoistureBalanceInputs {
  ventilationRate: number;
  ahInside: number;
  ahOutside: number;
  cropEvaporation: number;
  foggingRate: number;
}

export interface MoistureBalanceResult {
  moistureRemoved: number;
  netBalance: number;
  trend: 'increase' | 'decrease' | 'stable';
}

export function computeMoistureBalance(inputs: MoistureBalanceInputs): MoistureBalanceResult {
  const moistureRemoved = inputs.ventilationRate * (inputs.ahInside - inputs.ahOutside);
  const netBalance = inputs.cropEvaporation + inputs.foggingRate - moistureRemoved;

  let trend: 'increase' | 'decrease' | 'stable';
  if (Math.abs(netBalance) < 0.005) {
    trend = 'stable';
  } else if (netBalance > 0) {
    trend = 'increase';
  } else {
    trend = 'decrease';
  }

  return { moistureRemoved, netBalance, trend };
}
