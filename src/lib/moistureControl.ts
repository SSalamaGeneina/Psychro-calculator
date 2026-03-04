import { absoluteHumidity } from './psychro';

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

  const moistureExhaust = inputs.capacity > 0
    ? totalFlow * (insideAH - outsideAH) / (inputs.greenhouseArea > 0 ? inputs.greenhouseArea : 1)
    : 0;

  const ahDiff = cropAH - insideAH;
  const diffusion = ahDiff * inputs.cropHeight * 0.9;
  const airMovement = inputs.capacity > 0 ? (inputs.capacity / 3600) * 100 : 0;
  const totalMoistureTransport = diffusion + airMovement * ahDiff * 0.1;

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
