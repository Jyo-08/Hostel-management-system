import React from 'react';

interface OccupancyBarProps {
  occupied: number;
  total: number;
  showLabels?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const OccupancyBar: React.FC<OccupancyBarProps> = ({
  occupied,
  total,
  showLabels = true,
  size = 'md',
  className = '',
}) => {
  const percentage = total > 0 ? Math.min(100, Math.round((occupied / total) * 100)) : 0;

  let progressColor = 'bg-blue-600';
  if (percentage >= 90) {
    progressColor = 'bg-red-600';
  } else if (percentage >= 70) {
    progressColor = 'bg-amber-500';
  } else if (percentage >= 40) {
    progressColor = 'bg-blue-600';
  } else {
    progressColor = 'bg-green-600';
  }

  const heightClasses = {
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-2.5',
  };

  return (
    <div className={`w-full ${className}`}>
      {showLabels && (
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-gray-500">
            <strong className="text-gray-900">{occupied}</strong> of {total} beds occupied
          </span>
          <span className="font-semibold text-gray-700">{percentage}%</span>
        </div>
      )}
      <div className={`w-full bg-gray-200 rounded-full overflow-hidden ${heightClasses[size]}`}>
        <div
          className={`${progressColor} ${heightClasses[size]} rounded-full transition-all duration-300`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

