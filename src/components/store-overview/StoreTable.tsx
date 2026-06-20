import { Store } from '@/types';
import { ChevronRight, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStore } from '@/store/useStore';

interface StoreTableProps {
  stores: Store[];
  onStoreClick?: (store: Store) => void;
}

export default function StoreTable({ stores, onStoreClick }: StoreTableProps) {
  const { setSelectedStore } = useStore();

  const getRiskLevel = (store: Store) => {
    if (store.completionRate >= 95) return 'normal';
    if (store.completionRate >= 85) return 'warning';
    return 'danger';
  };

  const handleRowClick = (store: Store) => {
    if (onStoreClick) {
      onStoreClick(store);
    } else {
      setSelectedStore(store.id);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-gray-900">门店发放明细</h3>
          <p className="text-sm text-gray-500 mt-0.5">共 {stores.length} 家门店</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-md transition-colors">
            按完成率排序
          </button>
          <button className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-md transition-colors">
            按逾期数排序
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50/50">
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                门店
              </th>
              <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                本周应发
              </th>
              <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                已发
              </th>
              <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                逾期未发
              </th>
              <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                提前发放
              </th>
              <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                完成率
              </th>
              <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                趋势
              </th>
              <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {stores.map((store) => {
              const riskLevel = getRiskLevel(store);
              const TrendIcon = store.trend === 'up'
                ? TrendingUp
                : store.trend === 'down'
                ? TrendingDown
                : Minus;

              return (
                <tr
                  key={store.id}
                  onClick={() => handleRowClick(store)}
                  className={cn(
                    'hover:bg-blue-50/30 transition-colors cursor-pointer',
                    riskLevel === 'danger' && 'bg-red-50/30',
                    riskLevel === 'warning' && 'bg-orange-50/20',
                  )}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          'w-2 h-2 rounded-full',
                          riskLevel === 'normal' && 'bg-green-500',
                          riskLevel === 'warning' && 'bg-orange-500',
                          riskLevel === 'danger' && 'bg-red-500 animate-pulse',
                        )}
                      ></div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {store.name}
                        </p>
                        <p className="text-xs text-gray-400">{store.city}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className="text-sm font-medium text-gray-700 tabular-nums">
                      {store.weeklyShouldSend}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className="text-sm font-semibold text-green-600 tabular-nums">
                      {store.weeklySent}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span
                      className={cn(
                        'text-sm font-semibold tabular-nums',
                        store.weeklyOverdue > 10
                          ? 'text-red-600'
                          : store.weeklyOverdue > 5
                          ? 'text-orange-600'
                          : 'text-gray-600'
                      )}
                    >
                      {store.weeklyOverdue}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className="text-sm font-medium text-blue-600 tabular-nums">
                      {store.weeklyEarly}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-20 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            'h-full rounded-full transition-all duration-500',
                            riskLevel === 'normal' && 'bg-green-500',
                            riskLevel === 'warning' && 'bg-orange-500',
                            riskLevel === 'danger' && 'bg-red-500'
                          )}
                          style={{ width: `${store.completionRate}%` }}
                        ></div>
                      </div>
                      <span
                        className={cn(
                          'text-sm font-medium tabular-nums w-12',
                          riskLevel === 'normal' && 'text-green-600',
                          riskLevel === 'warning' && 'text-orange-600',
                          riskLevel === 'danger' && 'text-red-600'
                        )}
                      >
                        {store.completionRate}%
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-center gap-1">
                      <TrendIcon
                        className={cn(
                          'w-4 h-4',
                          store.trend === 'up' && 'text-green-500',
                          store.trend === 'down' && 'text-red-500',
                          store.trend === 'flat' && 'text-gray-400'
                        )}
                      />
                      <span
                        className={cn(
                          'text-xs font-medium tabular-nums',
                          store.trend === 'up' && 'text-green-600',
                          store.trend === 'down' && 'text-red-600',
                          store.trend === 'flat' && 'text-gray-500'
                        )}
                      >
                        {store.trendValue > 0 ? '+' : ''}
                        {store.trendValue}%
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors">
                      查看详情
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
