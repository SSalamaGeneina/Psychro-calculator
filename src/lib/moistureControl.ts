import { absoluteHumidity, moistAirDensity } from './psychro';

export interface MoistureControlInputs {
  greenhouseArea: number;
  capacity: number;
  pressureDiff: number;
  efficiency: number;
  outsideTemp: number;
  outsideRH: number;
  insideTemp: number;
  insideRH: number;
  cropTemp: number;
  cropRH: number;
  cropHeight: number;
  airPressure: number;
}

export interface FanResult {
  totalFlow: number;
  fanPower: number;
}

export interface HeatExchangerResult {
  powerPerM2: number;
  electricalConsumption: number;
}

export interface MoistureControlResult {
  fan: FanResult;
  heatExchanger: HeatExchangerResult;
  moistureExhaust: number;
  cropAH: number;
  insideAH: number;
  outsideAH: number;
  diffusion: number;
  airMovement: number;
  totalMoistureTransport: number;
}

export function computeMoistureControl(inputs: MoistureControlInputs): MoistureControlResult {
  const totalFlow = inputs.greenhouseArea * inputs.capacity;
  const effFraction = inputs.efficiency / 100.0;
  const fanPower = effFraction > 0
    ? (totalFlow * inputs.pressureDiff) / (effFraction * 3600)
    : Infinity;

  const powerPerM2 = inputs.greenhouseArea > 0 ? fanPower / inputs.greenhouseArea : 0;
  const electricalConsumption = (powerPerM2 * inputs.greenhouseArea * 3.6) / 1000.0;

  const outsideAH = absoluteHumidity(inputs.outsideTemp, inputs.outsideRH, inputs.airPressure);
  const insideAH = absoluteHumidity(inputs.insideTemp, inputs.insideRH, inputs.airPressure);
  const cropAH = absoluteHumidity(inputs.cropTemp, inputs.cropRH, inputs.airPressure);

  // Moisture terms are represented as humidity ratio in g/kg dry air.
  // Flow conversions therefore use dry-air density [kg_dry/m3] so:
  // m3/m2.hr * kg_dry/m3 * g/kg_dry => g/m2.hr
  const insideW = insideAH / 1000.0; // kg_water/kg_dry
  const rhoMoistInside = moistAirDensity(inputs.insideTemp, inputs.insideRH, inputs.airPressure);
  const rhoDryInside = rhoMoistInside / (1 + insideW);
  const dryAirFlux = inputs.capacity * rhoDryInside; // kg_dry/m2.hr

  const ahDiff = cropAH - insideAH;
  const moistureExhaust = Math.max(0, dryAirFlux * (insideAH - outsideAH));

  // Empirical canopy diffusion coefficient with units:
  // kg_dry/(m2.hr) per (g/kg_dry)
  const canopyDiffusionCoeff = inputs.cropHeight * 0.9;
  const diffusion = ahDiff * canopyDiffusionCoeff;

  const airMovement = inputs.capacity > 0 ? (inputs.capacity / 3600) * 100 : 0;
  const convectiveEffectiveness = 0.1;
  const convectiveTransport = dryAirFlux * ahDiff * convectiveEffectiveness;
  const totalMoistureTransport = diffusion + convectiveTransport;

  return {
    fan: { totalFlow, fanPower },
    heatExchanger: { powerPerM2, electricalConsumption },
    moistureExhaust,
    cropAH,
    insideAH,
    outsideAH,
    diffusion,
    airMovement,
    totalMoistureTransport,
  };
}
