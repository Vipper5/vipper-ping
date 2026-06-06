import { useEffect, useRef, useState } from 'react';
import { Clock, ChevronDown } from 'lucide-react';

// Horários de 00:00 a 23:30 em passos de 30 min.
const OPTIONS: string[] = (() => {
  const out: string[] = [];
  for (let h = 0; h < 24; h++) {
    for (const m of [0, 30]) {
      out.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    }
  }
  return out;
})();

interface TimePickerProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}

/**
 * Seletor de horário com o visual do site: o campo inteiro é clicável/hoverável
 * e abre uma lista de horários estilizada (em vez do input nativo).
 */
export function TimePicker({ value, onChange, placeholder = 'Selecionar horário' }: TimePickerProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener('mousedown', onDown);
    return () => window.removeEventListener('mousedown', onDown);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors hover:bg-subtle focus:outline-none focus:ring-2 focus:ring-viper-500"
        style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', color: value ? 'var(--text-primary)' : 'var(--text-muted)' }}
      >
        <Clock size={15} className="text-viper-400 shrink-0" />
        <span className="font-num flex-1 text-left">{value || placeholder}</span>
        <ChevronDown size={15} className={`text-base-muted shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          className="absolute z-50 mt-1 w-full max-h-56 overflow-y-auto rounded-md border py-1 shadow-e3 animate-slide-down"
          style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          {OPTIONS.map((t) => {
            const sel = t === value;
            return (
              <button
                key={t}
                type="button"
                onClick={() => { onChange(t); setOpen(false); }}
                className={`w-full text-left px-3 py-1.5 text-sm font-num transition-colors ${sel ? 'text-viper-500 font-semibold' : 'text-base-secondary'}`}
                style={sel ? { backgroundColor: 'var(--surface2)' } : undefined}
                onMouseEnter={(e) => { if (!sel) e.currentTarget.style.backgroundColor = 'var(--surface2)'; }}
                onMouseLeave={(e) => { if (!sel) e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                {t}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
