import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { absoluteHumidity, moistAirDensity } from '../../src/lib/psychro';
import { computeMoistureControl } from '../../src/lib/moistureControl';

describe('moisture control dimensional consistency', () => {
  test('computes moistureExhaust on dry-air mass basis (g/m2.hr)', () => {
    const inputs = {
      greenhouseArea: 160,
      capacity: 5,
      pressureDiff: 150,
      efficiency: 30,
      outsideTemp: 10,
      outsideRH: 60,
      insideTemp: 24,
      insideRH: 80,
      cropTemp: 22,
      cropRH: 95,
      cropHeight: 1.2,
      airPressure: 1013,
    };

    const result = computeMoistureControl(inputs);
    const insideAH = absoluteHumidity(inputs.insideTemp, inputs.insideRH, inputs.airPressure);
    const outsideAH = absoluteHumidity(inputs.outsideTemp, inputs.outsideRH, inputs.airPressure);
    const insideW = insideAH / 1000;
    const rhoMoist = moistAirDensity(inputs.insideTemp, inputs.insideRH, inputs.airPressure);
    const rhoDry = rhoMoist / (1 + insideW);
    const expected = Math.max(0, inputs.capacity * rhoDry * (insideAH - outsideAH));

    assert.ok(Math.abs(result.moistureExhaust - expected) < 1e-9);
  });

  test('clamps moistureExhaust to zero when outside is more humid than inside', () => {
    const result = computeMoistureControl({
      greenhouseArea: 200,
      capacity: 4,
      pressureDiff: 120,
      efficiency: 35,
      outsideTemp: 28,
      outsideRH: 95,
      insideTemp: 24,
      insideRH: 60,
      cropTemp: 23,
      cropRH: 85,
      cropHeight: 1,
      airPressure: 1013,
    });

    assert.equal(result.moistureExhaust, 0);
  });
});
