import React from 'react';
import { Loader2 } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'sage';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  icon,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-md transition-colors focus:outline-none focus:ring-1 disabled:opacity-50 disabled:cursor-not-allowed select-none';

  const sizeStyles: Record<ButtonSize, string> = {
    sm: 'text-xs px-2.5 py-1 gap-1.5 h-8',
    md: 'text-xs sm:text-sm px-3 py-1.5 gap-2 h-9',
    lg: 'text-sm px-4 py-2 gap-2 h-10',
  };

  const variantStyles: Record<ButtonVariant, string> = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 focus:ring-blue-500',
    secondary: 'bg-gray-100 text-gray-800 border border-gray-300 hover:bg-gray-200 focus:ring-gray-400',
    outline: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus:ring-gray-300',
    danger: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 focus:ring-red-500',
    ghost: 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:ring-gray-300',
    sage: 'bg-slate-700 text-white hover:bg-slate-800 focus:ring-slate-500',
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin text-current" />
      ) : icon ? (
        <span className="shrink-0">{icon}</span>
      ) : null}
      {children && <span>{children}</span>}
    </button>
  );
};

