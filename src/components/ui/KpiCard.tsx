import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface KpiCardProps {
  label: string;
  value: string | number;
  trend?: 'up' | 'down' | 'neutral';
  trendLabel?: string;
  icon?: React.ReactNode;
}

export function KpiCard({ label, value, trend, trendLabel, icon }: KpiCardProps) {
  const trendColor =
    trend === 'up' ? 'text-success' : trend === 'down' ? 'text-danger' : 'text-base-muted';
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;

  return (
    <div className="card rounded-md p-5">
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-mono uppercase tracking-wider text-base-muted">{label}</span>
        {icon && (
          <span className="w-8 h-8 rounded-md flex items-center justify-center bg-viper-500/10 text-viper-500 dark:text-viper-400">
            {icon}
          </span>
        )}
      </div>
      <div className="mt-3 text-3xl font-bold font-display tracking-tight text-base-primary">{value}</div>
      {trendLabel && trend && (
        <div className={`mt-1.5 flex items-center gap-1 text-xs font-mono ${trendColor}`}>
          <TrendIcon size={12} />
          <span>{trendLabel}</span>
        </div>
      )}
    </div>
  );
}
