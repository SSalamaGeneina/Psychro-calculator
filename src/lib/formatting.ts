export function fmt2(val: number): string {
  if (!isFinite(val)) return '∞';
  return val.toFixed(2);
}

export function fmt1(val: number): string {
  if (!isFinite(val)) return '∞';
  return val.toFixed(1);
}

export function fmtDiff2(val: number): string {
  if (!isFinite(val)) return '∞';
  const s = val.toFixed(2);
  return val > 0 ? `+${s}` : s;
}

export function fmtDiff1(val: number): string {
  if (!isFinite(val)) return '∞';
  const s = val.toFixed(1);
  return val > 0 ? `+${s}` : s;
}

export function parseNumericInput(value: string): number {
  const cleaned = value.replace(',', '.');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
