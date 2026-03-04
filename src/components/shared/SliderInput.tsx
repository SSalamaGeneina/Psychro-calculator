import { useCallback, useState, useEffect } from 'react';
import { parseNumericInput } from '../../lib/formatting';

interface SliderInputProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit: string;
  onChange: (value: number) => void;
  color?: string;
}

export default function SliderInput({
  label,
  value,
  min,
  max,
  step = 0.1,
  unit,
  onChange,
  color,
}: SliderInputProps) {
  const [textValue, setTextValue] = useState(String(value));

  useEffect(() => {
    setTextValue(String(Math.round(value * 100) / 100));
  }, [value]);

  const handleSlider = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = parseFloat(e.target.value);
      onChange(v);
    },
    [onChange]
  );

  const handleText = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      setTextValue(raw);
      const parsed = parseNumericInput(raw);
      if (!isNaN(parsed)) {
        const clamped = Math.min(max, Math.max(min, parsed));
        onChange(clamped);
      }
    },
    [onChange, min, max]
  );

  const handleBlur = useCallback(() => {
    setTextValue(String(Math.round(value * 100) / 100));
  }, [value]);

  return (
    <div className="flex items-center gap-2 w-full">
      <label className="text-xs font-medium w-10 shrink-0 text-brand-teal rtl:text-right">
        {label}
      </label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={handleSlider}
        className="flex-1 h-1.5 cursor-pointer accent-brand-teal"
        style={color ? { accentColor: color } : undefined}
      />
      <input
        type="text"
        inputMode="decimal"
        value={textValue}
        onChange={handleText}
        onBlur={handleBlur}
        className="w-14 text-xs text-center border border-gray-300 rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-brand-green"
      />
      <span className="text-xs text-gray-500 w-6 shrink-0">{unit}</span>
    </div>
  );
}
