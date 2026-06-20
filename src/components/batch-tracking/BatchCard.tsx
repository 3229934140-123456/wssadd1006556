import { Batch, BatchStage } from '@/types';
import {
  Package,
  Clock,
  MapPin,
  CheckCircle2,
  Circle,
  Loader2,
  AlertTriangle,
  Box,
  Archive,
  Send,
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

const stageConfig = [
  { key: 'distributed', label: '已分盒', icon: Box, color: 'blue' },
  { key: 'shelved', label: '已入柜', icon: Archive, color: 'purple' },
  { key: 'delivered', label: '已发放', icon: Send, color: 'green' },
];

export default function BatchCard({ batch, onClick }: BatchCardProps) {
  const status = statusMap[batch.status];

  const getStageCount = (key: string) => {
    switch (key) {
      case 'distributed':
        return batch.distributedCount;
      case 'shelved':
        return batch.shelvedCount;
      case 'delivered':
        return batch.deliveredCount;
      default:
        return 0;
    }
  };

  const getStageStatus = (index: number) => {
    const stageIndex = {
      distributed: 0,
      shelved: 1,
      delivered: 2,
    };
    const currentStage =
      batch.status === 'completed'
        ? 3
        : batch.status === 'delivering'
        ? 2
        : batch.status === 'shelved'
        ? 1
        : batch.status === 'distributing'
        ? 0
        : -1;

    if (index < currentStage || batch.status === 'completed') return 'completed';
    if (index === currentStage) return 'in-progress';
    return 'pending';
  };

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

  const currentStageIndex =
    batch.status === 'completed'
      ? 4
      : batch.status === 'delivering'
      ? 3
      : batch.status === 'shelved'
      ? 2
      : batch.status === 'distributing'
      ? 1
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

      <div className="flex items-start justify-between mb-5">
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
              batch.warningLevel === 'danger' && 'bg-red-50 text-red-600',
              batch.warningLevel === 'warning' && 'bg-orange-50 text-orange-600'
            )}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span className="text-xs font-medium">滞留 {batch.stayDays} 天</span>
          </div>
        )}
      </div>

      <div className="space-y-3">
        {stageConfig.map((stage, index) => {
          const StageIcon = stage.icon;
          const count = getStageCount(stage.key);
          const stageStatus = getStageStatus(index);
          const percentage = Math.round((count / batch.totalQuantity) * 100);

          return (
            <div key={stage.key}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      'w-7 h-7 rounded-lg flex items-center justify-center',
                      stageStatus === 'completed' && 'bg-green-100 text-green-600',
                      stageStatus === 'in-progress' && 'bg-blue-100 text-blue-600',
                      stageStatus === 'pending' && 'bg-gray-100 text-gray-400'
                    )}
                  >
                    <StageIcon className="w-4 h-4" />
                  </div>
                  <span
                    className={cn(
                      'text-sm font-medium',
                      stageStatus === 'completed' && 'text-gray-700',
                      stageStatus === 'in-progress' && 'text-blue-600',
                      stageStatus === 'pending' && 'text-gray-400'
                    )}
                  >
                    {stage.label}
                  </span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span
                    className={cn(
                      'text-base font-bold tabular-nums',
                      stageStatus === 'completed' && 'text-gray-700',
                      stageStatus === 'in-progress' && 'text-blue-600',
                      stageStatus === 'pending' && 'text-gray-300'
                    )}
                  >
                    {count}
                  </span>
                  <span className="text-xs text-gray-400">
                    / {batch.totalQuantity} 件
                  </span>
                </div>
              </div>
              <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-500',
                    stage.color === 'blue' &&
                      (stageStatus === 'pending' ? 'bg-gray-200' : 'bg-blue-500'),
                    stage.color === 'purple' &&
                      (stageStatus === 'pending' ? 'bg-gray-200' : 'bg-purple-500'),
                    stage.color === 'green' &&
                      (stageStatus === 'pending' ? 'bg-gray-200' : 'bg-green-500')
                  )}
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-5 pt-4 border-t border-gray-50">
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
