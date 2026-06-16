import React from 'react';

type BadgeVariant =
  | 'primary'
  | 'solid'
  | 'neutral'
  | 'success'
  | 'warning'
  | 'error'
  | 'info';

interface BadgeProps {
  variant?: BadgeVariant;
  dot?: boolean;
  children: React.ReactNode;
  className?: string;
}

const variantStyles: Record<BadgeVariant, React.CSSProperties> = {
  primary: { background: 'rgba(74,17,162,0.12)', color: '#9966E0', border: '0.5px solid rgba(74,17,162,0.25)' },
  solid:   { background: '#4A11A2', color: '#FFFFFF', border: 'none' },
  neutral: { background: 'var(--bg-subtle)', color: 'var(--text-muted)', border: '0.5px solid var(--border)' },
  success: { background: 'rgba(29,158,117,0.12)', color: '#1D9E75', border: '0.5px solid rgba(29,158,117,0.25)' },
  warning: { background: 'rgba(239,159,39,0.12)', color: '#EF9F27', border: '0.5px solid rgba(239,159,39,0.25)' },
  error:   { background: 'rgba(239,68,68,0.12)', color: '#EF4444', border: '0.5px solid rgba(239,68,68,0.25)' },
  info:    { background: 'rgba(55,138,221,0.12)', color: '#378ADD', border: '0.5px solid rgba(55,138,221,0.25)' },
};

const dotColors: Record<BadgeVariant, string> = {
  primary: '#9966E0',
  solid:   '#FFFFFF',
  neutral: 'var(--text-muted)',
  success: '#1D9E75',
  warning: '#EF9F27',
  error:   '#EF4444',
  info:    '#378ADD',
};

export function Badge({ variant = 'neutral', dot = false, children, className = '' }: BadgeProps) {
  return (
    <span
      className={className}
      style={{
        ...variantStyles[variant],
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        borderRadius: '4px',
        padding: '2px 6px',
        fontSize: '10px',
        fontFamily: 'Oswald, sans-serif',
        fontWeight: 500,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
      }}
    >
      {dot && (
        <span
          style={{ width: '5px', height: '5px', borderRadius: '50%', background: dotColors[variant], flexShrink: 0 }}
        />
      )}
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { variant: BadgeVariant; label: string }> = {
    Ativo:                { variant: 'success', label: 'Ativo' },
    Pausado:              { variant: 'warning', label: 'Pausado' },
    'Em Desenvolvimento': { variant: 'info',    label: 'Em Dev' },
    Pendente:             { variant: 'error',   label: 'Pendente' },
    'Concluído':          { variant: 'neutral', label: 'Concluído' },
    pendente:             { variant: 'neutral', label: 'Pendente' },
    em_andamento:         { variant: 'info',    label: 'Em andamento' },
    concluida:            { variant: 'success', label: 'Concluída' },
    alta:                 { variant: 'error',   label: 'Alta' },
    media:                { variant: 'warning', label: 'Média' },
    baixa:                { variant: 'neutral', label: 'Baixa' },
  };
  const cfg = map[status] ?? { variant: 'neutral' as BadgeVariant, label: status };
  return <Badge variant={cfg.variant} dot>{cfg.label}</Badge>;
}
