import { useState, useMemo } from 'react';
import BatchCard from '@/components/batch-tracking/BatchCard';
import { batches } from '@/data/batches';
import { Batch } from '@/types';
import {
  Package,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Truck,
  Search,
  Filter,
} from 'lucide-react';
import StatCard from '@/components/common/StatCard';
import { cn } from '@/lib/utils';

export default function BatchTracking() {
  const [activeTab, setActiveTab] = useState<'all' | 'warning' | 'processing' | 'completed'>('all');
  const [searchText, setSearchText] = useState('');

  const filteredBatches = useMemo(() => {
    return batches.filter((batch) => {
      if (searchText) {
        const search = searchText.toLowerCase();
        if (
          !batch.batchNo.toLowerCase().includes(search) &&
          !batch.storeName.toLowerCase().includes(search) &&
          !batch.manufacturer.toLowerCase().includes(search)
        ) {
          return false;
        }
      }

      switch (activeTab) {
        case 'warning':
          return batch.warningLevel === 'danger' || batch.warningLevel === 'warning';
        case 'processing':
          return batch.status !== 'completed';
        case 'completed':
          return batch.status === 'completed';
        default:
          return true;
      }
    });
  }, [activeTab, searchText]);

  const dangerCount = batches.filter((b) => b.warningLevel === 'danger').length;
  const warningCount = batches.filter((b) => b.warningLevel === 'warning').length;
  const processingCount = batches.filter((b) => b.status !== 'completed').length;
  const completedCount = batches.filter((b) => b.status === 'completed').length;

  const tabs = [
    { key: 'all', label: '全部批次', count: batches.length },
    { key: 'warning', label: '待关注', count: dangerCount + warningCount },
    { key: 'processing', label: '处理中', count: processingCount },
    { key: 'completed', label: '已完成', count: completedCount },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">批次追踪</h2>
          <p className="text-sm text-gray-500 mt-1">
            跟踪厂家到货后的分盒、入柜和发放进度
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="搜索批次号、门店、厂家..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-64 h-9 pl-9 pr-4 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-50 transition-all"
            />
          </div>
          <button className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2">
            <Filter className="w-4 h-4" />
            筛选
          </button>
          <button className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
            导出报表
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-5">
        <StatCard
          title="在途批次"
          value={processingCount}
          unit="批"
          icon={<Truck className="w-6 h-6" />}
          color="blue"
          trend="up"
          trendValue={12.5}
        />
        <StatCard
          title="红色预警"
          value={dangerCount}
          unit="批"
          icon={<AlertTriangle className="w-6 h-6" />}
          color="red"
          trend="up"
          trendValue={25}
        />
        <StatCard
          title="黄色预警"
          value={warningCount}
          unit="批"
          icon={<Clock className="w-6 h-6" />}
          color="orange"
          trend="down"
          trendValue={-10}
        />
        <StatCard
          title="本周完成"
          value={completedCount}
          unit="批"
          icon={<CheckCircle2 className="w-6 h-6" />}
          color="green"
          trend="up"
          trendValue={8.3}
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-1.5 inline-flex">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as typeof activeTab)}
            className={cn(
              'px-5 py-2 text-sm font-medium rounded-lg transition-all duration-200 flex items-center gap-2',
              activeTab === tab.key
                ? 'bg-blue-500 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            )}
          >
            {tab.label}
            <span
              className={cn(
                'px-1.5 py-0.5 text-xs font-medium rounded-md',
                activeTab === tab.key
                  ? 'bg-white/20 text-white'
                  : 'bg-gray-100 text-gray-500'
              )}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {filteredBatches.length > 0 ? (
        <div className="grid grid-cols-2 gap-5">
          {filteredBatches.map((batch) => (
            <BatchCard key={batch.id} batch={batch} />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 p-16 text-center">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">没有找到匹配的批次</p>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4">
          滞留批次排行
        </h3>
        <div className="space-y-3">
          {batches
            .filter((b) => b.stayDays > 0 && b.status !== 'completed')
            .sort((a, b) => b.stayDays - a.stayDays)
            .slice(0, 5)
            .map((batch, index) => (
              <div
                key={batch.id}
                className="flex items-center gap-4 p-3 bg-gray-50/50 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <span
                  className={cn(
                    'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white',
                    index === 0 && 'bg-red-500',
                    index === 1 && 'bg-orange-500',
                    index === 2 && 'bg-yellow-500',
                    index >= 3 && 'bg-gray-400'
                  )}
                >
                  {index + 1}
                </span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900 font-mono">
                      {batch.batchNo}
                    </span>
                    <span className="text-xs text-gray-400">
                      {batch.storeName}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {batch.manufacturer} · {batch.arrivalDate} 到货
                  </p>
                </div>
                <div className="text-right">
                  <p
                    className={cn(
                      'text-sm font-bold tabular-nums',
                      batch.stayDays >= 7 && 'text-red-600',
                      batch.stayDays >= 3 &&
                        batch.stayDays < 7 &&
                        'text-orange-600',
                      batch.stayDays < 3 && 'text-gray-600'
                    )}
                  >
                    {batch.stayDays} 天
                  </p>
                  <p className="text-xs text-gray-400">滞留</p>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
