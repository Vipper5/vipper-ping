import React, { createContext, useCallback, useContext, useState } from 'react';
import { CheckCircle2, XCircle, Info } from 'lucide-react';

type ToastKind = 'success' | 'error' | 'info';

interface ToastItem {
  id: number;
  kind: ToastKind;
  message: string;
}

interface ToastContextValue {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue>({
  success: () => {},
  error: () => {},
  info: () => {},
});

let nextId = 1;

const kindStyles: Record<ToastKind, { border: string; text: string; glow: string; icon: React.ReactNode }> = {
  success: {
    border: '#15BB77',
    text: '#15BB77',
    glow: '0 0 18px rgba(0,255,148,0.35)',
    icon: <CheckCircle2 size={16} />,
  },
  error: {
    border: '#E54056',
    text: '#E54056',
    glow: '0 0 18px rgba(229,64,86,0.40)',
    icon: <XCircle size={16} />,
  },
  info: {
    border: '#5294E6',
    text: '#5294E6',
    glow: '0 0 18px rgba(82,148,230,0.32)',
    icon: <Info size={16} />,
  },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const remove = useCallback((id: number) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const push = useCallback(
    (kind: ToastKind, message: string) => {
      const id = nextId++;
      setToasts((t) => [...t, { id, kind, message }]);
      window.setTimeout(() => remove(id), 3200);
    },
    [remove],
  );

  const value: ToastContextValue = {
    success: (m) => push('success', m),
    error: (m) => push('error', m),
    info: (m) => push('info', m),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-5 right-5 z-[60] flex flex-col gap-2 items-end">
        {toasts.map((t) => {
          const s = kindStyles[t.kind];
          return (
            <div
              key={t.id}
              role="status"
              onClick={() => remove(t.id)}
              className="flex items-center gap-2.5 pl-3.5 pr-4 py-2.5 rounded-md text-sm font-medium cursor-pointer animate-slide-down"
              style={{
                backgroundColor: 'var(--surface)',
                border: `1px solid ${s.border}`,
                color: s.text,
                boxShadow: `var(--card-shadow), ${s.glow}`,
              }}
            >
              <span style={{ color: s.text }}>{s.icon}</span>
              {t.message}
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
