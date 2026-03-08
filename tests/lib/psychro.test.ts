import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import {
  absoluteHumidity,
  computeDifferences,
  computeZoneProperties,
  dewPoint,
  enthalpy,
  saturationVaporPressure,
  vaporPressureDeficit,
} from '../../src/lib/psychro';

function refSaturationPressure(T: number): number {
  if (T < 0) {
    return 0.61115 * Math.exp((23.036 - T / 333.7) * (T / (279.82 + T)));
  }
  return 0.61121 * Math.exp((18.678 - T / 234.5) * (T / (257.14 + T)));
}

function refDewPointFromVp(vp: number): number {
  let lo = -100;
  let hi = 100;
  for (let i = 0; i < 60; i += 1) {
    const mid = (lo + hi) / 2;
    if (refSaturationPressure(mid) > vp) {
      hi = mid;
    } else {
      lo = mid;
    }
  }
  return (lo + hi) / 2;
}

const REFERENCE_CASES = [
  {
    T: 20,
    RH: 50,
    P: 1013.25,
    sat: 2.33834,
    ah: 7.26092,
    h: 38.54967,
    vpd: 1.16917,
    tdp: 9.27096,
  },
  {
    T: -5,
    RH: 80,
    P: 1013.25,
    sat: 0.4018,
    ah: 1.9795,
    h: -0.09768,
    vpd: 0.08036,
    tdp: -7.58575,
  },
  {
    T: -15,
    RH: 60,
    P: 900,
    sat: 0.16534,
    ah: 0.68635,
    h: -13.39258,
    vpd: 0.06613,
    tdp: -20.41967,
  },
  {
    T: 30,
    RH: 70,
    P: 1000,
    sat: 4.24513,
    ah: 19.04935,
    h: 78.88537,
    vpd: 1.27354,
    tdp: 23.92791,
  },
];

describe('psychrometric core', () => {
  test('matches trusted reference points for AH/VPD/H/dew point (including sub-zero)', () => {
    for (const c of REFERENCE_CASES) {
      assert.ok(Math.abs(saturationVaporPressure(c.T) - c.sat) < 0.005);
      assert.ok(Math.abs(absoluteHumidity(c.T, c.RH, c.P) - c.ah) < 0.02);
      assert.ok(Math.abs(enthalpy(c.T, c.RH, c.P) - c.h) < 0.05);
      assert.ok(Math.abs(vaporPressureDeficit(c.T, c.RH) - c.vpd) < 0.005);
      const tdp = dewPoint(c.T, c.RH);
      assert.notEqual(tdp, null);
      assert.ok(Math.abs((tdp as number) - c.tdp) < 0.05);
    }
  });

  test('stays aligned with reference equations across temperature/RH/pressure grids', () => {
    for (let T = -20; T <= 45; T += 5) {
      for (let RH = 5; RH <= 100; RH += 15) {
        for (let P = 900; P <= 1050; P += 50) {
          const sat = refSaturationPressure(T);
          const vp = sat * (RH / 100);
          const ahRef = vp >= P / 10 ? Infinity : (622 * vp) / (P / 10 - vp);
          const hRef = 1.006 * T + (ahRef / 1000) * (2501 + 1.86 * T);
          const vpdRef = sat - vp;
          const tdpRef = refDewPointFromVp(vp);

          assert.ok(Math.abs(saturationVaporPressure(T) - sat) < 1e-9);
          assert.ok(Math.abs(absoluteHumidity(T, RH, P) - ahRef) < 1e-9);
          assert.ok(Math.abs(enthalpy(T, RH, P) - hRef) < 1e-9);
          assert.ok(Math.abs(vaporPressureDeficit(T, RH) - vpdRef) < 1e-9);
          const tdp = dewPoint(T, RH);
          assert.notEqual(tdp, null);
          assert.ok(Math.abs((tdp as number) - tdpRef) < 1e-7);
        }
      }
    }
  });

  test('uses ice branch below zero and water branch above zero', () => {
    const satBelow = saturationVaporPressure(-0.1);
    const satAbove = saturationVaporPressure(0.1);
    assert.ok(satBelow > 0);
    assert.ok(satAbove > satBelow);
  });

  test('returns null dew point for RH <= 0', () => {
    assert.equal(dewPoint(20, 0), null);
    assert.equal(dewPoint(20, -5), null);
  });

  test('keeps zone properties/differences compatible with nullable dew point', () => {
    const left = computeZoneProperties(20, 0, 1013);
    const right = computeZoneProperties(22, 65, 1013);
    const diff = computeDifferences(20, 0, left, 22, 65, right);

    assert.equal(left.tdp, null);
    assert.equal(typeof right.tdp, 'number');
    assert.equal(diff.tdp, null);
  });
});
