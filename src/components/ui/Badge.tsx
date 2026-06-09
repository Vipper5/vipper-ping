import React from 'react';

type BadgeVariant =
  | 'primary'
  | 'solid'
  | 'accent'
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

const variantMap: Record<BadgeVariant, string> = {
  primary: 'border border-viper-300 text-viper-600 bg-viper-50 dark:border-viper-800 dark:text-viper-300 dark:bg-carvao-surface2',
  solid: 'bg-viper-500 text-white',
  accent: 'bg-neon-100 text-neon-800 dark:bg-neon-900 dark:text-neon-400',
  neutral: 'bg-neutral-100 text-neutral-700 dark:bg-carvao-surface2 dark:text-neutral-400',
  success: 'bg-green-100 text-success dark:bg-green-950 dark:text-neon-500',
  warning: 'bg-amber-100 text-warning dark:bg-amber-950 dark:text-warning',
  error: 'bg-red-100 text-danger dark:bg-red-950 dark:text-red-400',
  info: 'bg-blue-100 text-info dark:bg-blue-950 dark:text-blue-400',
};

const dotMap: Record<BadgeVariant, string> = {
  primary: 'bg-viper-500',
  solid: 'bg-white',
  accent: 'bg-neon-600',
  neutral: 'bg-neutral-500',
  success: 'bg-success',
  warning: 'bg-warning',
  error: 'bg-danger',
  info: 'bg-info',
};

export function Badge({ variant = 'neutral', dot = false, children, className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium font-mono ${variantMap[variant]} ${className}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotMap[variant]}`} />}
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { variant: BadgeVariant; label: string }> = {
    Ativo: { variant: 'success', label: 'Ativo' },
    Pausado: { variant: 'warning', label: 'Pausado' },
    'Em Desenvolvimento': { variant: 'info', label: 'Em Desenvolvimento' },
    Pendente: { variant: 'error', label: 'Pendente' },
    'Concluído': { variant: 'info', label: 'Concluído' },
    pendente: { variant: 'neutral', label: 'Pendente' },
    em_andamento: { variant: 'info', label: 'Em andamento' },
    concluida: { variant: 'success', label: 'Concluída' },
    alta: { variant: 'error', label: 'Alta' },
    media: { variant: 'warning', label: 'Média' },
    baixa: { variant: 'neutral', label: 'Baixa' },
  };
  const cfg = map[status] ?? { variant: 'neutral', label: status };
  return <Badge variant={cfg.variant} dot>{cfg.label}</Badge>;
}
