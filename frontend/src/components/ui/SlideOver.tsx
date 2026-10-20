import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface SlideOverProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: 'md' | 'lg' | 'xl';
}

export const SlideOver: React.FC<SlideOverProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  width = 'lg',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const widthClasses = {
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Clean backdrop */}
      <div
        className="fixed inset-0 bg-black/25 transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 flex max-w-full pl-6">
        <div
          className={`w-screen ${widthClasses[width]} bg-white border-l border-gray-200 shadow-lg flex flex-col`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start justify-between border-b border-gray-200 px-5 py-4 bg-gray-50">
            <div>
              <h2 className="text-base font-semibold text-gray-900">{title}</h2>
              {subtitle && (
                <p className="mt-0.5 text-xs text-gray-500">{subtitle}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4 text-sm text-gray-800">
            {children}
          </div>

          {/* Footer */}
          {footer && (
            <div className="border-t border-gray-200 bg-gray-50 px-5 py-3 flex items-center justify-end gap-2">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

