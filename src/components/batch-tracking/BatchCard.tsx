import { Batch, BatchStage } from '@/types';
import {
  Package,
  Clock,
  MapPin,
  CheckCircle2,
  Circle,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface BatchCardProps {
  batch: Batch;
  onClick?: () => void;
}

const statusMap: Record<string, { label: string; className: string }> = {
  arrived: { label: '已到货', className: 'bg-gray-100 text-gray-600' },
  distributing: { label: '分盒中', className: 'bg-blue-100 text-blue-600' },
  shelved: { label: '已入柜', className: 'bg-purple-100 text-purple-600' },
  delivering: { label: '发放中', className: 'bg-green-100 text-green-600' },
  completed: { label: '已完成', className: 'bg-green-100 text-green-600' },
};

export default function BatchCard({ batch, onClick }: BatchCardProps) {
  const status = statusMap[batch.status];

  const getStageIcon = (stage: BatchStage) => {
    switch (stage.status) {
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'in-progress':
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
      default:
        return <Circle className="w-5 h-5 text-gray-300" />;
    }
  };

  const progress =
    batch.status === 'completed'
      ? 100
      : batch.status === 'delivering'
      ? 75
      : batch.status === 'shelved'
      ? 50
      : batch.status === 'distributing'
      ? 25
      : 0;

  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-white rounded-xl border border-gray-100 p-5 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 cursor-pointer relative overflow-hidden',
        batch.warningLevel === 'danger' && 'border-red-200',
        batch.warningLevel === 'warning' && 'border-orange-200'
      )}
    >
      {batch.warningLevel === 'danger' && (
        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-red-500/10 to-transparent -rotate-45 -mr-10 -mt-10"></div>
      )}

      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-bold text-gray-900 font-mono tracking-wide">
              {batch.batchNo}
            </h4>
            <span
              className={cn(
                'px-2 py-0.5 text-xs font-medium rounded-md',
                status.className
              )}
            >
              {status.label}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-2">
            <span className="flex items-center gap-1 text-xs text-gray-500">
              <MapPin className="w-3 h-3" />
              {batch.storeName}
            </span>
            <span className="flex items-center gap-1 text-xs text-gray-500">
              <Package className="w-3 h-3" />
              {batch.manufacturer}
            </span>
          </div>
        </div>

        {batch.warningLevel !== 'normal' && (
          <div
            className={cn(
              'flex items-center gap-1 px-2.5 py-1 rounded-full',
              batch.warningLevel === 'danger' &&
                'bg-red-50 text-red-600',
              batch.warningLevel === 'warning' &&
                'bg-orange-50 text-orange-600'
            )}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span className="text-xs font-medium">
              滞留 {batch.stayDays} 天
            </span>
          </div>
        )}
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-500">处理进度</span>
          <span className="text-xs font-medium text-gray-700 tabular-nums">
            {Math.round(
              (batch.deliveredCount / batch.totalQuantity) * 100
            )}
            %
          </span>
        </div>
        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-500',
              batch.warningLevel === 'danger' && 'bg-red-500',
              batch.warningLevel === 'warning' && 'bg-orange-500',
              batch.warningLevel === 'normal' && 'bg-green-500'
            )}
            style={{
              width: `${(batch.deliveredCount / batch.totalQuantity) * 100}%`,
            }}
          ></div>
        </div>
        <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
          <span>到货 {batch.totalQuantity} 件</span>
          <span>已发 {batch.deliveredCount} 件</span>
        </div>
      </div>

      <div className="pt-4 border-t border-gray-50">
        <div className="flex items-center justify-between">
          {batch.stages.map((stage, index) => (
            <div key={index} className="flex flex-col items-center flex-1">
              {getStageIcon(stage)}
              <span
                className={cn(
                  'text-xs mt-1.5',
                  stage.status === 'completed' && 'text-gray-700',
                  stage.status === 'in-progress' && 'text-blue-600',
                  stage.status === 'pending' && 'text-gray-400'
                )}
              >
                {stage.name}
              </span>
              {stage.date && (
                <span className="text-[10px] text-gray-400 mt-0.5">
                  {stage.date.slice(5)}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-50">
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <Clock className="w-3.5 h-3.5" />
          <span>到货时间：{batch.arrivalDate}</span>
        </div>
        {batch.stayDays > 0 && batch.status !== 'completed' && (
          <span
            className={cn(
              'text-xs font-medium tabular-nums',
              batch.warningLevel === 'danger' && 'text-red-600',
              batch.warningLevel === 'warning' && 'text-orange-600',
              batch.warningLevel === 'normal' && 'text-gray-500'
            )}
          >
            已滞留 {batch.stayDays} 天
          </span>
        )}
      </div>
    </div>
  );
}
