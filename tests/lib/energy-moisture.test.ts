import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { computeEnergyBalance } from '../../src/lib/energyBalance';
import { STABLE_NET_BALANCE_BAND, computeMoistureBalance } from '../../src/lib/moistureBalance';

describe('energy balance edge cases', () => {
  test('returns noVentilationNeeded when qNet <= 0 (never negative ventilation)', () => {
    const result = computeEnergyBalance({
      solarRadiation: 0,
      radiationInsidePercent: 70,
      uValue: 8,
      tOutside: 10,
      tInside: 20,
      hOutside: 20,
      hInside: 30,
    });

    assert.equal(result.status, 'noVentilationNeeded');
    assert.equal(result.ventilationRate, 0);
    assert.ok(result.qNet <= 0);
  });

  test('returns notSolvable when qNet > 0 and dH <= 0', () => {
    const result = computeEnergyBalance({
      solarRadiation: 800,
      radiationInsidePercent: 100,
      uValue: 1,
      tOutside: 20,
      tInside: 22,
      hOutside: 50,
      hInside: 45,
    });

    assert.equal(result.status, 'notSolvable');
    assert.equal(result.ventilationRate, null);
    assert.ok(result.qNet > 0);
    assert.ok(result.dH <= 0);
  });

  test('returns ok when qNet > 0 and dH > 0', () => {
    const result = computeEnergyBalance({
      solarRadiation: 700,
      radiationInsidePercent: 80,
      uValue: 2,
      tOutside: 15,
      tInside: 20,
      hOutside: 25,
      hInside: 35,
    });

    assert.equal(result.status, 'ok');
    assert.notEqual(result.ventilationRate, null);
    assert.ok((result.ventilationRate as number) > 0);
  });
});

describe('moisture balance edge cases', () => {
  test('cannot compute when ventilation is invalid/unsolved', () => {
    const result = computeMoistureBalance({
      ventilationRate: null,
      ahInside: 12,
      ahOutside: 8,
      cropEvaporation: 60,
      foggingRate: 5,
    });

    assert.equal(result.status, 'cannotCompute');
    assert.equal(result.moistureRemoved, null);
    assert.equal(result.netBalance, null);
    assert.equal(result.trend, null);
  });

  test('uses operational stable band for trend', () => {
    const insideMinusOutside = 5; // g/kg dry air
    const moistureRemoved = 10; // g/m2.hr
    const ventilationRate = moistureRemoved / insideMinusOutside;

    const stable = computeMoistureBalance({
      ventilationRate,
      ahInside: 15,
      ahOutside: 10,
      cropEvaporation: moistureRemoved + STABLE_NET_BALANCE_BAND * 0.5,
      foggingRate: 0,
    });
    assert.equal(stable.status, 'ok');
    assert.equal(stable.trend, 'stable');

    const increase = computeMoistureBalance({
      ventilationRate,
      ahInside: 15,
      ahOutside: 10,
      cropEvaporation: moistureRemoved + STABLE_NET_BALANCE_BAND + 0.1,
      foggingRate: 0,
    });
    assert.equal(increase.trend, 'increase');
  });
});
