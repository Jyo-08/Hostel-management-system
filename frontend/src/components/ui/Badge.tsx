import React from 'react';

export type BadgeVariant =
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'neutral'
  | 'sage';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  className?: string;
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  className = '',
  dot = true,
}) => {
  const variantStyles: Record<BadgeVariant, { bg: string; text: string; dotColor: string; border: string }> = {
    success: {
      bg: 'bg-green-50',
      text: 'text-green-800',
      dotColor: 'bg-green-600',
      border: 'border-green-200',
    },
    warning: {
      bg: 'bg-amber-50',
      text: 'text-amber-800',
      dotColor: 'bg-amber-600',
      border: 'border-amber-200',
    },
    danger: {
      bg: 'bg-red-50',
      text: 'text-red-800',
      dotColor: 'bg-red-600',
      border: 'border-red-200',
    },
    info: {
      bg: 'bg-blue-50',
      text: 'text-blue-800',
      dotColor: 'bg-blue-600',
      border: 'border-blue-200',
    },
    sage: {
      bg: 'bg-slate-100',
      text: 'text-slate-800',
      dotColor: 'bg-slate-600',
      border: 'border-slate-200',
    },
    neutral: {
      bg: 'bg-gray-100',
      text: 'text-gray-700',
      dotColor: 'bg-gray-400',
      border: 'border-gray-200',
    },
  };

  const style = variantStyles[variant] || variantStyles.neutral;
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-0.5 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded border ${style.bg} ${style.text} ${style.border} ${sizeClasses} ${className}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${style.dotColor}`} />}
      {children}
    </span>
  );
};

export const getStatusBadgeVariant = (status: string): BadgeVariant => {
  const s = status.toLowerCase();
  if (['available', 'completed', 'active', 'present', 'resolved'].includes(s)) {
    return 'success';
  }
  if (['partially occupied', 'pending', 'in progress', 'medium'].includes(s)) {
    return 'warning';
  }
  if (['full', 'failed', 'absent', 'high', 'urgent', 'cancelled'].includes(s)) {
    return 'danger';
  }
  if (['under maintenance', 'boys', 'girls', 'co-ed'].includes(s)) {
    return 'sage';
  }
  return 'neutral';
};

