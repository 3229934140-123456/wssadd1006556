import { ReactNode } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: number;
  unit?: string;
  trend?: 'up' | 'down' | 'flat';
  trendValue?: number;
  icon?: ReactNode;
  color: 'blue' | 'green' | 'red' | 'orange';
  onClick?: () => void;
}

const colorMap = {
  blue: {
    bg: 'bg-blue-50',
    border: 'border-blue-100',
    text: 'text-blue-600',
    iconBg: 'bg-blue-500',
  },
  green: {
    bg: 'bg-green-50',
    border: 'border-green-100',
    text: 'text-green-600',
    iconBg: 'bg-green-500',
  },
  red: {
    bg: 'bg-red-50',
    border: 'border-red-100',
    text: 'text-red-600',
    iconBg: 'bg-red-500',
  },
  orange: {
    bg: 'bg-orange-50',
    border: 'border-orange-100',
    text: 'text-orange-600',
    iconBg: 'bg-orange-500',
  },
};

export default function StatCard({
  title,
  value,
  unit = '件',
  trend,
  trendValue,
  icon,
  color,
  onClick,
}: StatCardProps) {
  const colors = colorMap[color];

  const TrendIcon = trend === 'up'
    ? TrendingUp
    : trend === 'down'
    ? TrendingDown
    : Minus;

  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-white rounded-xl border border-gray-100 p-5 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 cursor-pointer',
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-500 mb-2">{title}</p>
          <div className="flex items-baseline gap-1">
            <span
              className={cn(
                'text-3xl font-bold tabular-nums',
                colors.text
              )}
            >
              {value.toLocaleString()}
            </span>
            <span className="text-sm text-gray-400">{unit}</span>
          </div>
        </div>
        <div
          className={cn(
            'w-12 h-12 rounded-xl flex items-center justify-center text-white',
            colors.iconBg
          )}
        >
          {icon}
        </div>
      </div>

      {trend && trendValue !== undefined && (
        <div className="mt-4 pt-4 border-t border-gray-50 flex items-center gap-2">
          <TrendIcon
            className={cn(
              'w-4 h-4',
              trend === 'up'
                ? 'text-green-500'
                : trend === 'down'
                ? 'text-red-500'
                : 'text-gray-400'
            )}
          />
          <span
            className={cn(
              'text-sm font-medium',
              trend === 'up'
                ? 'text-green-600'
                : trend === 'down'
                ? 'text-red-600'
                : 'text-gray-500'
            )}
          >
            {trendValue > 0 ? '+' : ''}
            {trendValue}%
          </span>
          <span className="text-sm text-gray-400">较上周</span>
        </div>
      )}
    </div>
  );
}
