'use client';

import { cn } from '../../utils/helpers';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  iconColor: string;
  trend?: number;
  trendLabel?: string;
  variant?: 'default' | 'elevated';
  className?: string;
}

export function StatCard({
  label,
  value,
  icon,
  iconColor,
  trend,
  trendLabel,
  variant = 'default',
  className,
}: StatCardProps) {
  const isPositive = trend !== undefined && trend >= 0;

  return (
    <Card variant={variant} className={cn('stat-card', className)}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="stat-label">{label}</p>
          <p className="stat-value mt-1">{typeof value === 'number' ? value.toLocaleString('es-ES') : value}</p>
          {(trend !== undefined || trendLabel) && (
            <div className="stat-trend">
              {trend !== undefined && (
                <span className={cn(
                  'flex items-center gap-1 font-medium',
                  isPositive ? 'trend-up' : 'trend-down'
                )}>
                  {isPositive ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                  )}
                  {trend >= 0 ? '+' : ''}{trend.toFixed(1)}%
                </span>
              )}
              {trendLabel && (
                <span className="text-bakery-500 ml-1">{trendLabel}</span>
              )}
            </div>
          )}
        </div>
        <div
          className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: `${iconColor}15`, color: iconColor }}
          aria-hidden="true"
        >
          {icon}
        </div>
      </div>
    </Card>
  );
}

interface QuickActionProps {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
  badge?: string | number;
  disabled?: boolean;
}

export function QuickAction({
  label,
  icon,
  onClick,
  variant = 'secondary',
  badge,
  disabled = false,
}: QuickActionProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex flex-col items-center gap-2 p-4 rounded-xl border transition-all duration-200',
        variant === 'primary'
          ? 'bg-bakery-600 text-white border-bakery-600 hover:bg-bakery-700 shadow-soft'
          : 'bg-white text-bakery-700 border-bakery-100 hover:bg-bakery-50 hover:border-bakery-200',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
      aria-disabled={disabled}
    >
      <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', variant === 'primary' ? 'bg-white/20' : 'bg-bakery-100')}>
        {icon}
      </div>
      <span className="text-sm font-medium text-center">{label}</span>
      {badge && (
        <Badge variant="danger" size="sm" className={variant === 'primary' ? 'bg-red-500' : ''}>
          {badge}
        </Badge>
      )}
    </button>
  );
}

interface ActivityItemProps {
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  title: string;
  description: string;
  time: string;
  unread?: boolean;
}

export function ActivityItem({
  icon,
  iconBg,
  iconColor,
  title,
  description,
  time,
  unread = false,
}: ActivityItemProps) {
  return (
    <div className={cn('flex items-start gap-3 p-3 rounded-lg hover:bg-bakery-50 transition-colors', unread && 'bg-bakery-50/50')}>
      <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0', iconBg)}>
        <span className={cn('text-lg', iconColor)}>{icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn('text-sm font-medium text-bakery-900', unread && 'font-semibold')}>{title}</p>
        <p className="text-sm text-bakery-500 mt-0.5 truncate">{description}</p>
        <p className="text-xs text-bakery-400 mt-1">{time}</p>
      </div>
      {unread && (
        <span className="w-2 h-2 rounded-full bg-bakery-600 flex-shrink-0 mt-1" aria-label="Nueva actividad" />
      )}
    </div>
  );
}