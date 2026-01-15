import { Tile, SkeletonText } from '@carbon/react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: {
    direction: 'up' | 'down' | 'neutral';
    value: string;
  };
  loading?: boolean;
  variant?: 'default' | 'success' | 'warning' | 'error';
}

export function StatCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  loading = false,
  variant = 'default',
}: StatCardProps) {
  if (loading) {
    return (
      <Tile className="stat-card">
        <SkeletonText width="50%" />
        <SkeletonText heading width="30%" />
        <SkeletonText width="40%" />
      </Tile>
    );
  }

  const getTrendClass = () => {
    if (!trend) return '';
    switch (trend.direction) {
      case 'up':
        return 'stat-card__trend--up';
      case 'down':
        return 'stat-card__trend--down';
      default:
        return 'stat-card__trend--neutral';
    }
  };

  const getVariantClass = () => {
    switch (variant) {
      case 'success':
        return 'stat-card--success';
      case 'warning':
        return 'stat-card--warning';
      case 'error':
        return 'stat-card--error';
      default:
        return '';
    }
  };

  return (
    <Tile className={`stat-card ${getVariantClass()}`}>
      <div className="stat-card__header">
        <span className="stat-card__title">{title}</span>
        {icon && <span className="stat-card__icon">{icon}</span>}
      </div>
      <div className="stat-card__value">{value}</div>
      <div className="stat-card__footer">
        {subtitle && <span className="stat-card__subtitle">{subtitle}</span>}
        {trend && (
          <span className={`stat-card__trend ${getTrendClass()}`}>
            {trend.direction === 'up' ? '↑' : trend.direction === 'down' ? '↓' : '→'}
            {trend.value}
          </span>
        )}
      </div>
    </Tile>
  );
}
