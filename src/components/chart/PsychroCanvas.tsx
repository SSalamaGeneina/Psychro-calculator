import { useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../../store/useAppStore';
import { saturationVaporPressure, vaporPressure, absoluteHumidity } from '../../lib/psychro';

const T_MIN = -10;
const T_MAX = 55;
const AH_MIN = 0;
const AH_MAX = 30;
const PADDING = { top: 40, right: 60, bottom: 50, left: 60 };

const ZONE_COLORS: Record<string, string> = {
  outside: '#003d48',
  aboveScreen: '#00c400',
  inside: '#0077a8',
  plant: '#DB7B2B',
};

export default function PsychroCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { t } = useTranslation();
  const { airPressure, zones, ui } = useAppStore();
  const animRef = useRef<number>(0);

  const toX = useCallback(
    (T: number, w: number) =>
      PADDING.left + ((T - T_MIN) / (T_MAX - T_MIN)) * (w - PADDING.left - PADDING.right),
    []
  );

  const toY = useCallback(
    (ah: number, h: number) =>
      PADDING.top + ((AH_MAX - ah) / (AH_MAX - AH_MIN)) * (h - PADDING.top - PADDING.bottom),
    []
  );

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;

    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, w, h);

    // Grid lines
    ctx.strokeStyle = '#E5E7EB';
    ctx.lineWidth = 0.5;
    for (let T = T_MIN; T <= T_MAX; T += 5) {
      const x = toX(T, w);
      ctx.beginPath();
      ctx.moveTo(x, PADDING.top);
      ctx.lineTo(x, h - PADDING.bottom);
      ctx.stroke();
    }
    for (let ah = 0; ah <= AH_MAX; ah += 5) {
      const y = toY(ah, h);
      ctx.beginPath();
      ctx.moveTo(PADDING.left, y);
      ctx.lineTo(w - PADDING.right, y);
      ctx.stroke();
    }

    // Enthalpy lines (brand teal, lighter)
    ctx.strokeStyle = '#003d4840';
    ctx.lineWidth = 0.5;
    ctx.font = '9px "DM Sans", sans-serif';
    ctx.fillStyle = '#003d48';
    for (let H = 0; H <= 120; H += 10) {
      ctx.beginPath();
      let started = false;
      let labelX = 0, labelY = 0;
      for (let ah = AH_MIN; ah <= AH_MAX; ah += 0.5) {
        const w_ratio = ah / 1000;
        const T = (H - w_ratio * 2501) / (1.006 + w_ratio * 1.86);
        if (T < T_MIN || T > T_MAX) continue;
        const x = toX(T, w);
        const y = toY(ah, h);
        if (!started) {
          ctx.moveTo(x, y);
          started = true;
          labelX = x;
          labelY = y;
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
      if (started && labelY > PADDING.top + 5) {
        ctx.fillText(`${H}`, labelX - 12, labelY - 3);
      }
    }

    // RH curves (brand green)
    const drawRHCurve = (rh: number, color: string, lineWidth: number, label: boolean) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.beginPath();
      let started = false;
      let lastX = 0, lastY = 0;
      for (let T = T_MIN; T <= T_MAX; T += 0.5) {
        const vp = vaporPressure(T, rh);
        const P_kPa = airPressure / 10.0;
        if (vp >= P_kPa) continue;
        const ah = (622 * vp) / (P_kPa - vp);
        if (ah > AH_MAX) continue;
        const x = toX(T, w);
        const y = toY(ah, h);
        if (!started) {
          ctx.moveTo(x, y);
          started = true;
        } else {
          ctx.lineTo(x, y);
        }
        lastX = x;
        lastY = y;
      }
      ctx.stroke();

      if (label && started) {
        ctx.fillStyle = color;
        ctx.font = '9px "DM Sans", sans-serif';
        ctx.fillText(`${rh}%`, lastX + 2, lastY + 3);
      }
    };

    for (let rh = 10; rh <= 90; rh += 10) {
      drawRHCurve(rh, '#00c40088', 0.7, true);
    }
    // Saturation curve bold
    drawRHCurve(100, '#DB7B2B', 2.5, false);

    // Saturation label
    ctx.fillStyle = '#DB7B2B';
    ctx.font = 'bold 10px "DM Sans", sans-serif';
    const satAH50 = absoluteHumidity(50, 100, airPressure);
    if (satAH50 <= AH_MAX) {
      const lx = toX(50, w);
      const ly = toY(satAH50, h);
      ctx.fillText('100%', lx + 3, ly - 5);
    } else {
      const satVP35 = saturationVaporPressure(35);
      const P_kPa = airPressure / 10;
      if (satVP35 < P_kPa) {
        const satAH35 = absoluteHumidity(35, 100, airPressure);
        const lx = toX(35, w);
        const ly = toY(Math.min(satAH35, AH_MAX), h);
        ctx.fillText('100%', lx + 3, ly - 5);
      }
    }

    // Axis labels
    ctx.fillStyle = '#003d48';
    ctx.font = '11px "DM Sans", sans-serif';
    ctx.textAlign = 'center';
    for (let T = T_MIN; T <= T_MAX; T += 5) {
      ctx.fillText(`${T}`, toX(T, w), h - PADDING.bottom + 15);
    }
    ctx.fillText(t('chart.tempAxis'), w / 2, h - 8);

    ctx.textAlign = 'right';
    for (let ah = 0; ah <= AH_MAX; ah += 5) {
      ctx.fillText(`${ah}`, w - PADDING.right + 25, toY(ah, h) + 3);
    }

    ctx.save();
    ctx.translate(w - 12, h / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.fillText(t('chart.moistureAxis'), 0, 0);
    ctx.restore();

    // Zone data points
    if (ui.moreInfo) {
      const zoneKeys = ['outside', 'aboveScreen', 'inside', 'plant'] as const;
      for (const key of zoneKeys) {
        const z = zones[key];
        const ah = absoluteHumidity(z.temp, z.rh, airPressure);
        if (z.temp < T_MIN || z.temp > T_MAX || ah > AH_MAX) continue;
        const x = toX(z.temp, w);
        const y = toY(ah, h);

        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.fillStyle = ZONE_COLORS[key];
        ctx.fill();
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }

    // Air pressure label
    ctx.fillStyle = '#003d4899';
    ctx.font = '10px "DM Sans", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(t('chart.airPressureLabel', { value: airPressure }), PADDING.left, h - 8);
  }, [airPressure, zones, ui.moreInfo, t, toX, toY]);

  useEffect(() => {
    cancelAnimationFrame(animRef.current);
    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [draw]);

  useEffect(() => {
    const handleResize = () => {
      cancelAnimationFrame(animRef.current);
      animRef.current = requestAnimationFrame(draw);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-[400px] md:h-[500px] border border-brand-blue rounded-lg bg-white"
      aria-label={t('chart.title')}
    />
  );
}
