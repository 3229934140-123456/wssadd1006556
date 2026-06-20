import { useState, useMemo, useEffect } from 'react';
import BatchCard from '@/components/batch-tracking/BatchCard';
import { batches as initialBatches } from '@/data/batches';
import { stores } from '@/data/stores';
import { Batch } from '@/types';
import {
  Package,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Truck,
  Search,
  Filter,
  X,
  Flag,
  MapPin,
} from 'lucide-react';
import StatCard from '@/components/common/StatCard';
import { cn } from '@/lib/utils';
import { useStore } from '@/store/useStore';

interface Filters {
  storeId: string;
  manufacturer: string;
  stayDaysMin: string;
  stayDaysMax: string;
  stage: string;
  anomalyType: string;
}

const manufacturers = ['隐适美', '时代天使', '正雅'];
const stageOptions = [
  { value: '', label: '全部阶段' },
  { value: 'arrived', label: '已到货' },
  { value: 'distributing', label: '分盒中' },
  { value: 'shelved', label: '已入柜' },
  { value: 'delivering', label: '发放中' },
  { value: 'completed', label: '已完成' },
];
const anomalyTypeOptions = [
  { value: '', label: '全部异常' },
  { value: 'stuck_distributing', label: '分盒卡顿' },
  { value: 'stuck_shelving', label: '入柜延迟' },
  { value: 'stuck_notifying', label: '通知未达' },
  { value: 'patient_not_picked_up', label: '患者未取走' },
];

type TabKey = '' | 'warning' | 'processing' | 'completed' | 'anomaly';

export default function BatchTracking() {
  const { selectedStoreId, setSelectedStore, batchAnomalies } = useStore();
  const [showFilter, setShowFilter] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [activeTab, setActiveTab] = useState<TabKey>('');
  const batchData = initialBatches;
  const [filters, setFilters] = useState<Filters>({
    storeId: '',
    manufacturer: '',
    stayDaysMin: '',
    stayDaysMax: '',
    stage: '',
    anomalyType: '',
  });

  useEffect(() => {
    if (selectedStoreId) {
      setFilters((prev) => ({ ...prev, storeId: selectedStoreId }));
    } else {
      setFilters((prev) => ({ ...prev, storeId: '' }));
    }
  }, [selectedStoreId]);

  const baseFilteredBatches = useMemo(() => {
    return batchData.filter((batch) => {
      const mergedAnomaly = batchAnomalies.get(batch.id) || batch.anomaly;
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

      if (filters.storeId && batch.storeId !== filters.storeId) return false;
      if (filters.manufacturer && batch.manufacturer !== filters.manufacturer) return false;
      if (filters.stayDaysMin && batch.stayDays < parseInt(filters.stayDaysMin)) return false;
      if (filters.stayDaysMax && batch.stayDays > parseInt(filters.stayDaysMax)) return false;
      if (filters.stage && batch.status !== filters.stage) return false;
      if (filters.anomalyType && mergedAnomaly?.type !== filters.anomalyType) return false;

      return true;
    });
  }, [searchText, filters, batchData, batchAnomalies]);

  const filteredBatches = useMemo(() => {
    switch (activeTab) {
      case 'processing':
        return baseFilteredBatches.filter((b) => b.status !== 'completed');
      case 'warning':
        return baseFilteredBatches.filter(
          (b) => b.warningLevel === 'danger' || b.warningLevel === 'warning'
        );
      case 'completed':
        return baseFilteredBatches.filter((b) => b.status === 'completed');
      case 'anomaly':
        return baseFilteredBatches.filter((b) => (batchAnomalies.get(b.id) || b.anomaly));
      default:
        return baseFilteredBatches;
    }
  }, [baseFilteredBatches, activeTab, batchAnomalies]);

  const stats = useMemo(() => {
    const data = baseFilteredBatches;
    return {
      processing: data.filter((b) => b.status !== 'completed').length,
      danger: data.filter((b) => b.warningLevel === 'danger').length,
      warning: data.filter((b) => b.warningLevel === 'warning').length,
      completed: data.filter((b) => b.status === 'completed').length,
      anomaly: data.filter((b) => (batchAnomalies.get(b.id) || b.anomaly)).length,
      total: data.length,
    };
  }, [baseFilteredBatches, batchAnomalies]);

  const topStayBatches = useMemo(() => {
    return baseFilteredBatches
      .filter((b) => b.stayDays > 0 && b.status !== 'completed')
      .sort((a, b) => b.stayDays - a.stayDays)
      .slice(0, 5);
  }, [baseFilteredBatches]);

  const anomalySummary = useMemo(() => {
    const anomalyBatches = baseFilteredBatches.filter((b) => (batchAnomalies.get(b.id) || b.anomaly));
    const typeMap = new Map<string, { label: string; count: number; stores: Map<string, string> }>();

    anomalyBatches.forEach((batch) => {
      const anom = batchAnomalies.get(batch.id) || batch.anomaly;
      const type = anom!.type;
      if (!typeMap.has(type)) {
        typeMap.set(type, {
          label: anom!.label,
          count: 0,
          stores: new Map(),
        });
      }
      const entry = typeMap.get(type)!;
      entry.count++;
      entry.stores.set(batch.storeId, batch.storeName);
    });

    return Array.from(typeMap.entries())
      .map(([type, data]) => ({
        type,
        label: data.label,
        count: data.count,
        storeNames: Array.from(data.stores.values()),
      }))
      .sort((a, b) => b.count - a.count);
  }, [baseFilteredBatches]);

  const handleFilterChange = (key: keyof Filters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    if (key === 'storeId') {
      setSelectedStore(value || null);
    }
  };

  const handleReset = () => {
    setFilters({
      storeId: '',
      manufacturer: '',
      stayDaysMin: '',
      stayDaysMax: '',
      stage: '',
      anomalyType: '',
    });
    setSelectedStore(null);
    setActiveTab('');
  };

  const hasActiveFilters =
    filters.storeId ||
    filters.manufacturer ||
    filters.stayDaysMin ||
    filters.stayDaysMax ||
    filters.stage ||
    filters.anomalyType;

  const tabs = [
    { key: '' as TabKey, label: '全部批次', count: stats.total },
    { key: 'processing' as TabKey, label: '处理中', count: stats.processing },
    { key: 'warning' as TabKey, label: '待关注', count: stats.danger + stats.warning },
    { key: 'anomaly' as TabKey, label: '异常标记', count: stats.anomaly },
    { key: 'completed' as TabKey, label: '已完成', count: stats.completed },
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
          <button
            onClick={() => setShowFilter(!showFilter)}
            className={cn(
              'px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2',
              showFilter || hasActiveFilters
                ? 'bg-blue-50 text-blue-600 border border-blue-200'
                : 'text-gray-600 bg-white border border-gray-200 hover:bg-gray-50'
            )}
          >
            <Filter className="w-4 h-4" />
            筛选
            {hasActiveFilters && (
              <span className="w-5 h-5 bg-blue-500 text-white rounded-full text-xs flex items-center justify-center">
                {Object.values(filters).filter(Boolean).length}
              </span>
            )}
          </button>
          <button className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
            导出报表
          </button>
        </div>
      </div>

      {showFilter && (
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">筛选条件</span>
            </div>
            {hasActiveFilters && (
              <button
                onClick={handleReset}
                className="text-xs text-gray-500 hover:text-blue-600 flex items-center gap-1"
              >
                <X className="w-3 h-3" />
                重置
              </button>
            )}
          </div>

          <div className="grid grid-cols-6 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">所属门店</label>
              <select
                value={filters.storeId}
                onChange={(e) => handleFilterChange('storeId', e.target.value)}
                className="w-full h-9 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:bg-white focus:border-blue-300 focus:ring-2 focus:ring-blue-50 transition-all"
              >
                <option value="">全部门店</option>
                {stores.map((store) => (
                  <option key={store.id} value={store.id}>
                    {store.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1.5">厂家品牌</label>
              <select
                value={filters.manufacturer}
                onChange={(e) => handleFilterChange('manufacturer', e.target.value)}
                className="w-full h-9 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:bg-white focus:border-blue-300 focus:ring-2 focus:ring-blue-50 transition-all"
              >
                <option value="">全部厂家</option>
                {manufacturers.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1.5">处理阶段</label>
              <select
                value={filters.stage}
                onChange={(e) => handleFilterChange('stage', e.target.value)}
                className="w-full h-9 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:bg-white focus:border-blue-300 focus:ring-2 focus:ring-blue-50 transition-all"
              >
                {stageOptions.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1.5">异常类型</label>
              <select
                value={filters.anomalyType}
                onChange={(e) => handleFilterChange('anomalyType', e.target.value)}
                className="w-full h-9 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:bg-white focus:border-blue-300 focus:ring-2 focus:ring-blue-50 transition-all"
              >
                {anomalyTypeOptions.map((a) => (
                  <option key={a.value} value={a.value}>{a.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1.5">滞留天数</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="最小"
                  value={filters.stayDaysMin}
                  onChange={(e) => handleFilterChange('stayDaysMin', e.target.value)}
                  className="w-full h-9 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-blue-300 focus:ring-2 focus:ring-blue-50 transition-all"
                />
                <span className="text-gray-400 text-xs">-</span>
                <input
                  type="number"
                  placeholder="最大"
                  value={filters.stayDaysMax}
                  onChange={(e) => handleFilterChange('stayDaysMax', e.target.value)}
                  className="w-full h-9 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-blue-300 focus:ring-2 focus:ring-blue-50 transition-all"
                />
              </div>
            </div>

            <div className="flex items-end">
              <button
                onClick={handleReset}
                className="w-full h-9 px-4 flex items-center justify-center gap-1.5 text-sm text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
                重置筛选
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-4 gap-5">
        <StatCard
          title="在途批次"
          value={stats.processing}
          unit="批"
          icon={<Truck className="w-6 h-6" />}
          color="blue"
        />
        <StatCard
          title="红色预警"
          value={stats.danger}
          unit="批"
          icon={<AlertTriangle className="w-6 h-6" />}
          color="red"
        />
        <StatCard
          title="异常标记"
          value={stats.anomaly}
          unit="批"
          icon={<Flag className="w-6 h-6" />}
          color="orange"
        />
        <StatCard
          title="已完成"
          value={stats.completed}
          unit="批"
          icon={<CheckCircle2 className="w-6 h-6" />}
          color="green"
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-1.5 inline-flex">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'px-5 py-2 text-sm font-medium rounded-lg transition-all duration-200 flex items-center gap-2',
                isActive
                  ? 'bg-blue-500 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              )}
            >
              {tab.label}
              <span
                className={cn(
                  'px-1.5 py-0.5 text-xs font-medium rounded-md',
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'bg-gray-100 text-gray-500'
                )}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className={anomalySummary.length > 0 ? 'col-span-2' : 'col-span-3'}>
          {filteredBatches.length > 0 ? (
            <div className="grid grid-cols-2 gap-5">
              {filteredBatches.map((batch) => (
                <BatchCard
                  key={batch.id}
                  batch={batch}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-100 p-16 text-center">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">没有找到匹配的批次</p>
              {hasActiveFilters && (
                <button
                  onClick={handleReset}
                  className="mt-3 text-sm text-blue-600 hover:text-blue-700"
                >
                  重置筛选条件
                </button>
              )}
            </div>
          )}
        </div>

        {anomalySummary.length > 0 && (
          <div className="space-y-5">
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-gray-900">异常原因汇总</h3>
                <span className="text-xs text-gray-400">基于当前筛选</span>
              </div>
              <div className="space-y-3">
                {anomalySummary.map((item) => (
                  <div
                    key={item.type}
                    className="p-3 bg-amber-50/50 rounded-lg border border-amber-100/50"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Flag className="w-4 h-4 text-amber-500" />
                        <span className="text-sm font-medium text-gray-900">
                          {item.label}
                        </span>
                      </div>
                      <span className="text-lg font-bold text-amber-600 tabular-nums">
                        {item.count}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <MapPin className="w-3 h-3 text-gray-400" />
                      {item.storeNames.map((name, i) => (
                        <span
                          key={i}
                          className="text-xs bg-white px-2 py-0.5 rounded-md border border-gray-100 text-gray-600"
                        >
                          {name}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-gray-900">滞留批次排行</h3>
                <span className="text-xs text-gray-400">基于当前筛选结果</span>
              </div>
              {topStayBatches.length > 0 ? (
                <div className="space-y-3">
                  {topStayBatches.map((batch, index) => (
                    <div
                      key={batch.id}
                      className="flex items-center gap-3 p-2.5 bg-gray-50/50 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <span
                        className={cn(
                          'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white',
                          index === 0 && 'bg-red-500',
                          index === 1 && 'bg-orange-500',
                          index === 2 && 'bg-yellow-500',
                          index >= 3 && 'bg-gray-400'
                        )}
                      >
                        {index + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900 font-mono">
                            {batch.batchNo}
                          </span>
                          {(batchAnomalies.get(batch.id) || batch.anomaly) && (
                            <span className="text-[10px] px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded">
                              {(batchAnomalies.get(batch.id) || batch.anomaly)!.label}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {batch.storeName} · {batch.manufacturer}
                        </p>
                      </div>
                      <span
                        className={cn(
                          'text-sm font-bold tabular-nums',
                          batch.stayDays >= 7 && 'text-red-600',
                          batch.stayDays >= 3 && batch.stayDays < 7 && 'text-orange-600',
                          batch.stayDays < 3 && 'text-gray-600'
                        )}
                      >
                        {batch.stayDays}天
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <Clock className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">当前筛选下无滞留批次</p>
                </div>
              )}
            </div>
          </div>
        )}

        {anomalySummary.length === 0 && topStayBatches.length > 0 && (
          <div className="space-y-5">
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-gray-900">滞留批次排行</h3>
                <span className="text-xs text-gray-400">基于当前筛选结果</span>
              </div>
              <div className="space-y-3">
                {topStayBatches.map((batch, index) => (
                  <div
                    key={batch.id}
                    className="flex items-center gap-3 p-2.5 bg-gray-50/50 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <span
                      className={cn(
                        'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white',
                        index === 0 && 'bg-red-500',
                        index === 1 && 'bg-orange-500',
                        index === 2 && 'bg-yellow-500',
                        index >= 3 && 'bg-gray-400'
                      )}
                    >
                      {index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900 font-mono">
                          {batch.batchNo}
                        </span>
                        {batch.anomaly && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded">
                            {batch.anomaly.label}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {batch.storeName} · {batch.manufacturer}
                      </p>
                    </div>
                    <span
                      className={cn(
                        'text-sm font-bold tabular-nums',
                        batch.stayDays >= 7 && 'text-red-600',
                        batch.stayDays >= 3 && batch.stayDays < 7 && 'text-orange-600',
                        batch.stayDays < 3 && 'text-gray-600'
                      )}
                    >
                      {batch.stayDays}天
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
