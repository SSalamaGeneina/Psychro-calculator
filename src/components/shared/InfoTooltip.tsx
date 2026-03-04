import { useState, useRef, useEffect } from 'react';

interface InfoTooltipProps {
  text: string;
}

export default function InfoTooltip({ text }: InfoTooltipProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="text-brand-teal hover:text-brand-green text-xs font-bold w-4 h-4 rounded-full border border-brand-teal/40 inline-flex items-center justify-center focus:outline-none focus:ring-1 focus:ring-brand-green"
        aria-label="Info"
        tabIndex={0}
      >
        i
      </button>
      {open && (
        <div className="absolute z-50 bottom-full mb-2 ltr:left-0 rtl:right-0 w-64 p-3 bg-white border border-gray-200 rounded-lg shadow-lg text-xs text-gray-700 leading-relaxed">
          {text}
          <div className="absolute top-full ltr:left-3 rtl:right-3 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-gray-200" />
        </div>
      )}
    </div>
  );
}
