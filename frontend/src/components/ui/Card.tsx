import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  onClick,
  hoverable = false,
}) => {
  return (
    <div
      onClick={onClick}
      className={`bg-white border border-gray-200 rounded-md p-4 sm:p-5 ${
        hoverable ? 'hover:border-gray-300 hover:bg-gray-50/50 cursor-pointer transition-colors' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
};

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  iconBg?: string;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  onClick?: () => void;
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  iconBg = 'bg-gray-100 text-gray-700',
  trend,
  onClick,
  className = '',
}) => {
  return (
    <div
      onClick={onClick}
      className={`bg-white border border-gray-200 rounded-md p-4 ${
        onClick ? 'hover:border-gray-300 hover:bg-gray-50/50 cursor-pointer transition-colors' : ''
      } ${className}`}
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500 truncate">
            {title}
          </p>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-gray-900">
              {value}
            </span>
            {trend && (
              <span
                className={`text-xs font-semibold ${
                  trend.isPositive ? 'text-green-700' : 'text-red-700'
                }`}
              >
                {trend.value}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="mt-1 text-xs text-gray-500 truncate">{subtitle}</p>
          )}
        </div>
        <div className={`p-2 rounded border border-gray-200 shrink-0 ${iconBg}`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

