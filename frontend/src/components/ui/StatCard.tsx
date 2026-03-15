import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { clsx } from 'clsx';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: React.ReactNode;
  iconColor?: string;
  iconBg?: string;
  isLoading?: boolean;
  className?: string;
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  change,
  changeLabel,
  icon,
  iconColor = 'text-primary-600',
  iconBg = 'bg-primary-50 dark:bg-primary-900/20',
  isLoading = false,
  className,
  onClick,
}) => {
  const changeIsPositive = change !== undefined && change > 0;
  const changeIsNegative = change !== undefined && change < 0;

  return (
    <div
      className={clsx(
        'bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm',
        onClick && 'cursor-pointer hover:shadow-md transition-shadow',
        className
      )}
      onClick={onClick}
    >
      {isLoading ? (
        <div className="animate-pulse space-y-3">
          <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-3 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
      ) : (
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
              {title}
            </p>
            <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-100 truncate">
              {value}
            </p>
            {(change !== undefined || changeLabel) && (
              <div className="mt-2 flex items-center gap-1">
                {change !== undefined && (
                  <>
                    {changeIsPositive && <TrendingUp className="h-4 w-4 text-green-500" />}
                    {changeIsNegative && <TrendingDown className="h-4 w-4 text-red-500" />}
                    {change === 0 && <Minus className="h-4 w-4 text-gray-400" />}
                    <span
                      className={clsx(
                        'text-sm font-medium',
                        changeIsPositive && 'text-green-600 dark:text-green-400',
                        changeIsNegative && 'text-red-600 dark:text-red-400',
                        change === 0 && 'text-gray-500'
                      )}
                    >
                      {changeIsPositive ? '+' : ''}
                      {change.toFixed(1)}%
                    </span>
                  </>
                )}
                {changeLabel && (
                  <span className="text-sm text-gray-500 dark:text-gray-400">{changeLabel}</span>
                )}
              </div>
            )}
          </div>

          {icon && (
            <div
              className={clsx(
                'flex-shrink-0 p-3 rounded-xl ml-4',
                iconBg
              )}
            >
              <div className={clsx('h-6 w-6', iconColor)}>{icon}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
