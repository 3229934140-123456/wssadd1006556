import { useMemo, useState } from 'react';
import {
  Package,
  Send,
  AlertTriangle,
  Clock,
  Users,
  ArrowLeft,
  Calendar,
  ChevronRight,
  Flag,
  ClipboardList,
  LayoutGrid,
} from 'lucide-react';
import StatCard from '@/components/common/StatCard';
import StoreTable from '@/components/store-overview/StoreTable';
import TrendChart from '@/components/store-overview/TrendChart';
import { stores, trendData, totalStats } from '@/data/stores';
import { useStore } from '@/store/useStore';
import { patients } from '@/data/patients';
import { batches } from '@/data/batches';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

type ViewMode = 'overview' | 'review';

interface ReviewItem {
  id: string;
  type: 'overdue' | 'high_risk' | 'delayed_batch';
  storeId: string;
  storeName: string;
  title: string;
  detail: string;
  severity: 'danger' | 'warning' | 'info';
  date: string;
}

export default function StoreOverview() {
  const { selectedStore, setSelectedStore, clearSelectedStore } = useStore();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<ViewMode>('overview');

  const storePatients = useMemo(() => {
    if (!selectedStore) return [];
    return patients.filter((p) => p.storeId === selectedStore.id);
  }, [selectedStore]);

  const storeBatches = useMemo(() => {
    if (!selectedStore) return [];
    return batches.filter((b) => b.storeId === selectedStore.id);
  }, [selectedStore]);

  const highRiskCount = useMemo(() => {
    return storePatients.filter((p) => p.riskLevel === 'high').length;
  }, [storePatients]);

  const warningBatches = useMemo(() => {
    return storeBatches.filter(
      (b) => b.warningLevel !== 'normal' && b.status !== 'completed'
    ).length;
  }, [storeBatches]);

  const reviewItems = useMemo(() => {
    const items: ReviewItem[] = [];
    const targetStores = selectedStore ? [selectedStore] : stores;

    targetStores.forEach((store) => {
      const storeOverduePatients = patients.filter(
        (p) => p.storeId === store.id && p.overdueDays > 7
      );
      storeOverduePatients.forEach((p) => {
        items.push({
          id: `patient-${p.id}`,
          type: 'overdue',
          storeId: store.id,
          storeName: store.name,
          title: p.name,
          detail: `逾期 ${p.overdueDays} 天 · ${p.remainingAligners}副剩余 · ${p.lastCommunicationResult}`,
          severity: 'danger',
          date: p.lastCommunication,
        });
      });

      const storeHighRisk = patients.filter(
        (p) => p.storeId === store.id && p.riskLevel === 'high' && p.overdueDays <= 7
      );
      storeHighRisk.forEach((p) => {
        items.push({
          id: `risk-${p.id}`,
          type: 'high_risk',
          storeId: store.id,
          storeName: store.name,
          title: p.name,
          detail: `高风险 · 逾期${p.overdueDays}天 · 客服：${p.customerService}`,
          severity: 'warning',
          date: p.lastCommunication,
        });
      });

      const storeDelayed = batches.filter(
        (b) => b.storeId === store.id && b.status !== 'completed' && b.stayDays >= 3
      );
      storeDelayed.forEach((b) => {
        items.push({
          id: `batch-${b.id}`,
          type: 'delayed_batch',
          storeId: store.id,
          storeName: store.name,
          title: b.batchNo,
          detail: `滞留${b.stayDays}天 · ${b.manufacturer} · ${b.deliveredCount}/${b.totalQuantity}已发放${b.anomaly ? ` · 异常：${b.anomaly.label}` : ''}`,
          severity: b.stayDays >= 7 ? 'danger' : 'warning',
          date: b.arrivalDate,
        });
      });
    });

    return items.sort((a, b) => {
      const severityOrder = { danger: 0, warning: 1, info: 2 };
      if (severityOrder[a.severity] !== severityOrder[b.severity]) {
        return severityOrder[a.severity] - severityOrder[b.severity];
      }
      return b.date.localeCompare(a.date);
    });
  }, [selectedStore]);

  const reviewStats = useMemo(() => {
    return {
      overdue: reviewItems.filter((i) => i.type === 'overdue').length,
      highRisk: reviewItems.filter((i) => i.type === 'high_risk').length,
      delayedBatch: reviewItems.filter((i) => i.type === 'delayed_batch').length,
      total: reviewItems.length,
    };
  }, [reviewItems]);

  const reviewByStore = useMemo(() => {
    const map = new Map<string, { storeName: string; items: ReviewItem[] }>();
    reviewItems.forEach((item) => {
      if (!map.has(item.storeId)) {
        map.set(item.storeId, { storeName: item.storeName, items: [] });
      }
      map.get(item.storeId)!.items.push(item);
    });
    return Array.from(map.entries())
      .map(([storeId, data]) => ({ storeId, ...data }))
      .sort((a, b) => b.items.length - a.items.length);
  }, [reviewItems]);

  const handleStoreClick = (storeId: string) => {
    setSelectedStore(storeId);
  };

  const handleItemNavigate = (item: ReviewItem) => {
    setSelectedStore(item.storeId);
    if (item.type === 'delayed_batch') {
      navigate('/batches');
    } else {
      navigate('/patients');
    }
  };

  if (selectedStore) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={clearSelectedStore}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              返回全部门店
            </button>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {selectedStore.name}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {selectedStore.city} · 门店运营详情
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setViewMode(viewMode === 'review' ? 'overview' : 'review')}
              className={cn(
                'px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2',
                viewMode === 'review'
                  ? 'bg-purple-50 text-purple-600 border border-purple-200'
                  : 'text-gray-600 bg-white border border-gray-200 hover:bg-gray-50'
              )}
            >
              <ClipboardList className="w-4 h-4" />
              {viewMode === 'review' ? '退出周会复盘' : '周会复盘'}
            </button>
            <button className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
              导出报表
            </button>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-5">
          <StatCard
            title="本周应发"
            value={selectedStore.weeklyShouldSend}
            unit="件"
            trend={selectedStore.trend}
            trendValue={selectedStore.trendValue}
            icon={<Package className="w-6 h-6" />}
            color="blue"
          />
          <StatCard
            title="已发放"
            value={selectedStore.weeklySent}
            unit="件"
            icon={<Send className="w-6 h-6" />}
            color="green"
          />
          <StatCard
            title="逾期未发"
            value={selectedStore.weeklyOverdue}
            unit="件"
            icon={<AlertTriangle className="w-6 h-6" />}
            color="red"
          />
          <StatCard
            title="提前发放"
            value={selectedStore.weeklyEarly}
            unit="件"
            icon={<Clock className="w-6 h-6" />}
            color="orange"
          />
        </div>

        {viewMode === 'review' ? (
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-50">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-gray-900">
                    {selectedStore.name} · 周会复盘清单
                  </h3>
                  <p className="text-sm text-gray-500 mt-0.5">
                    共 {reviewItems.length} 项待复盘事项
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {reviewStats.overdue > 0 && (
                    <span className="px-2.5 py-1 text-xs font-medium bg-red-50 text-red-600 rounded-full border border-red-200">
                      逾期未发 {reviewStats.overdue}
                    </span>
                  )}
                  {reviewStats.highRisk > 0 && (
                    <span className="px-2.5 py-1 text-xs font-medium bg-orange-50 text-orange-600 rounded-full border border-orange-200">
                      高风险 {reviewStats.highRisk}
                    </span>
                  )}
                  {reviewStats.delayedBatch > 0 && (
                    <span className="px-2.5 py-1 text-xs font-medium bg-amber-50 text-amber-600 rounded-full border border-amber-200">
                      滞留批次 {reviewStats.delayedBatch}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="divide-y divide-gray-50">
              {reviewItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleItemNavigate(item)}
                  className="px-6 py-3.5 hover:bg-blue-50/30 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={cn(
                        'w-9 h-9 rounded-lg flex items-center justify-center',
                        item.type === 'overdue' && 'bg-red-100 text-red-600',
                        item.type === 'high_risk' && 'bg-orange-100 text-orange-600',
                        item.type === 'delayed_batch' && 'bg-amber-100 text-amber-600'
                      )}
                    >
                      {item.type === 'overdue' && <AlertTriangle className="w-5 h-5" />}
                      {item.type === 'high_risk' && <Users className="w-5 h-5" />}
                      {item.type === 'delayed_batch' && <Package className="w-5 h-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold text-gray-900">{item.title}</h4>
                        <span
                          className={cn(
                            'px-1.5 py-0.5 text-[11px] font-medium rounded border',
                            item.type === 'overdue' && 'bg-red-50 text-red-600 border-red-200',
                            item.type === 'high_risk' && 'bg-orange-50 text-orange-600 border-orange-200',
                            item.type === 'delayed_batch' && 'bg-amber-50 text-amber-600 border-amber-200'
                          )}
                        >
                          {item.type === 'overdue' && '逾期未发'}
                          {item.type === 'high_risk' && '高风险患者'}
                          {item.type === 'delayed_batch' && '滞留批次'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{item.detail}</p>
                    </div>
                    <span className="text-xs text-gray-400">{item.date}</span>
                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
                  </div>
                </div>
              ))}
              {reviewItems.length === 0 && (
                <div className="py-16 text-center text-gray-400">
                  <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">本周无待复盘事项</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-4 gap-5">
              <div
                onClick={() => navigate('/patients')}
                className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">在治患者</p>
                    <p className="text-3xl font-bold text-gray-900 tabular-nums mt-2">
                      {storePatients.length}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center text-white">
                    <Users className="w-6 h-6" />
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-50">
                  <div className="flex items-center gap-2">
                    <span className="text-red-600 text-sm font-medium">
                      {highRiskCount} 人高风险
                    </span>
                    <span className="text-gray-400 text-xs">需重点关注</span>
                  </div>
                </div>
              </div>

              <div
                onClick={() => navigate('/batches')}
                className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">在途批次</p>
                    <p className="text-3xl font-bold text-gray-900 tabular-nums mt-2">
                      {storeBatches.filter((b) => b.status !== 'completed').length}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center text-white">
                    <Package className="w-6 h-6" />
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-50">
                  <div className="flex items-center gap-2">
                    <span
                      className={
                        warningBatches > 0
                          ? 'text-red-600 text-sm font-medium'
                          : 'text-green-600 text-sm font-medium'
                      }
                    >
                      {warningBatches > 0
                        ? `${warningBatches} 批待关注`
                        : '全部正常'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-100 p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">完成率</p>
                    <p className="text-3xl font-bold tabular-nums mt-2">
                      {selectedStore.completionRate}%
                    </p>
                  </div>
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center text-white ${
                      selectedStore.completionRate >= 95
                        ? 'bg-green-500'
                        : selectedStore.completionRate >= 85
                        ? 'bg-orange-500'
                        : 'bg-red-500'
                    }`}
                  >
                    <Send className="w-6 h-6" />
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-50">
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        selectedStore.completionRate >= 95
                          ? 'bg-green-500'
                          : selectedStore.completionRate >= 85
                          ? 'bg-orange-500'
                          : 'bg-red-500'
                      }`}
                      style={{ width: `${selectedStore.completionRate}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-100 p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">平均滞留</p>
                    <p className="text-3xl font-bold text-gray-900 tabular-nums mt-2">
                      {storeBatches.length > 0
                        ? Math.round(
                            storeBatches.reduce((sum, b) => sum + b.stayDays, 0) /
                              storeBatches.length
                          )
                        : 0}
                    </p>
                    <span className="text-sm text-gray-400">天</span>
                  </div>
                  <div className="w-12 h-12 bg-yellow-500 rounded-xl flex items-center justify-center text-white">
                    <Clock className="w-6 h-6" />
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-50">
                  <span className="text-xs text-gray-400">批次库存周转天数</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-6">
              <div className="col-span-2">
                <TrendChart data={trendData} />
              </div>
              <div className="space-y-6">
                <div className="bg-white rounded-xl border border-gray-100 p-6">
                  <h3 className="text-base font-semibold text-gray-900 mb-4">
                    高风险患者
                  </h3>
                  {storePatients.filter((p) => p.riskLevel === 'high').length > 0 ? (
                    <div className="space-y-3">
                      {storePatients
                        .filter((p) => p.riskLevel === 'high')
                        .slice(0, 4)
                        .map((patient) => (
                          <div
                            key={patient.id}
                            className="flex items-center gap-3 p-2.5 bg-red-50/50 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                            onClick={() => navigate('/patients')}
                          >
                            <div className="w-8 h-8 bg-gradient-to-br from-red-400 to-red-600 rounded-full flex items-center justify-center text-white text-xs font-medium">
                              {patient.name.slice(0, 1)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {patient.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                逾期 {patient.overdueDays} 天
                              </p>
                            </div>
                            <span className="text-xs text-red-600 font-medium">
                              {patient.remainingAligners}副剩余
                            </span>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-400">
                      <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">暂无高风险患者</p>
                    </div>
                  )}
                  <button
                    onClick={() => navigate('/patients')}
                    className="w-full mt-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    查看全部患者 →
                  </button>
                </div>

                <div className="bg-white rounded-xl border border-gray-100 p-6">
                  <h3 className="text-base font-semibold text-gray-900 mb-4">
                    待处理批次
                  </h3>
                  {storeBatches.filter((b) => b.status !== 'completed').length > 0 ? (
                    <div className="space-y-3">
                      {storeBatches
                        .filter((b) => b.status !== 'completed')
                        .slice(0, 4)
                        .map((batch) => (
                          <div
                            key={batch.id}
                            className="p-2.5 bg-gray-50/80 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                            onClick={() => navigate('/batches')}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-mono font-medium text-gray-700">
                                {batch.batchNo}
                              </span>
                              <span
                                className={
                                  batch.warningLevel === 'danger'
                                    ? 'text-xs text-red-600 font-medium'
                                    : batch.warningLevel === 'warning'
                                    ? 'text-xs text-orange-600 font-medium'
                                    : 'text-xs text-gray-500'
                                }
                              >
                                {batch.stayDays}天
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              {batch.manufacturer} · {batch.totalQuantity}件
                              {batch.anomaly && (
                                <span className="ml-2 text-amber-600">
                                  · <Flag className="w-3 h-3 inline" /> {batch.anomaly.label}
                                </span>
                              )}
                            </p>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-400">
                      <Package className="w-10 h-10 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">暂无在途批次</p>
                    </div>
                  )}
                  <button
                    onClick={() => navigate('/batches')}
                    className="w-full mt-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    查看全部批次 →
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  const { totalShouldSend, totalSent, totalOverdue, totalEarly } = totalStats;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">门店概览</h2>
          <p className="text-sm text-gray-500 mt-1">
            本周（6月15日 - 6月21日）各门店矫治器发放情况
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setViewMode(viewMode === 'review' ? 'overview' : 'review')}
            className={cn(
              'px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2',
              viewMode === 'review'
                ? 'bg-purple-50 text-purple-600 border border-purple-200'
                : 'text-gray-600 bg-white border border-gray-200 hover:bg-gray-50'
            )}
          >
            <ClipboardList className="w-4 h-4" />
            {viewMode === 'review' ? '退出周会复盘' : '周会复盘'}
          </button>
          <button className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            本周
          </button>
          <button className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
            导出报表
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-5">
        <StatCard
          title="本周应发总数"
          value={totalShouldSend}
          unit="件"
          trend="up"
          trendValue={3.2}
          icon={<Package className="w-6 h-6" />}
          color="blue"
        />
        <StatCard
          title="已发放"
          value={totalSent}
          unit="件"
          trend="up"
          trendValue={2.8}
          icon={<Send className="w-6 h-6" />}
          color="green"
        />
        <StatCard
          title="逾期未发"
          value={totalOverdue}
          unit="件"
          trend="up"
          trendValue={5.6}
          icon={<AlertTriangle className="w-6 h-6" />}
          color="red"
        />
        <StatCard
          title="提前发放"
          value={totalEarly}
          unit="件"
          trend="down"
          trendValue={-1.2}
          icon={<Clock className="w-6 h-6" />}
          color="orange"
        />
      </div>

      {viewMode === 'review' ? (
        <div className="space-y-5">
          <div className="grid grid-cols-3 gap-5">
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">逾期未发</p>
                  <p className="text-2xl font-bold text-red-600 tabular-nums">
                    {reviewStats.overdue}
                  </p>
                </div>
              </div>
              <p className="text-xs text-gray-400">逾期超过7天的患者</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">高风险患者</p>
                  <p className="text-2xl font-bold text-orange-600 tabular-nums">
                    {reviewStats.highRisk}
                  </p>
                </div>
              </div>
              <p className="text-xs text-gray-400">需重点关注的在治患者</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                  <Package className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">滞留批次</p>
                  <p className="text-2xl font-bold text-amber-600 tabular-nums">
                    {reviewStats.delayedBatch}
                  </p>
                </div>
              </div>
              <p className="text-xs text-gray-400">滞留超过3天的在途批次</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2">
              <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-gray-900">周会复盘清单</h3>
                    <p className="text-sm text-gray-500 mt-0.5">
                      共 {reviewItems.length} 项待复盘事项，按严重程度排序
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {reviewStats.overdue > 0 && (
                      <span className="px-2 py-0.5 text-xs font-medium bg-red-50 text-red-600 rounded-full">
                        逾期 {reviewStats.overdue}
                      </span>
                    )}
                    {reviewStats.highRisk > 0 && (
                      <span className="px-2 py-0.5 text-xs font-medium bg-orange-50 text-orange-600 rounded-full">
                        风险 {reviewStats.highRisk}
                      </span>
                    )}
                    {reviewStats.delayedBatch > 0 && (
                      <span className="px-2 py-0.5 text-xs font-medium bg-amber-50 text-amber-600 rounded-full">
                        滞留 {reviewStats.delayedBatch}
                      </span>
                    )}
                  </div>
                </div>
                <div className="divide-y divide-gray-50 max-h-[600px] overflow-y-auto">
                  {reviewItems.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleItemNavigate(item)}
                      className="px-6 py-3 hover:bg-blue-50/30 transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
                            item.type === 'overdue' && 'bg-red-100 text-red-600',
                            item.type === 'high_risk' && 'bg-orange-100 text-orange-600',
                            item.type === 'delayed_batch' && 'bg-amber-100 text-amber-600'
                          )}
                        >
                          {item.type === 'overdue' && <AlertTriangle className="w-4 h-4" />}
                          {item.type === 'high_risk' && <Users className="w-4 h-4" />}
                          {item.type === 'delayed_batch' && <Package className="w-4 h-4" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-900">{item.title}</span>
                            <span
                              className={cn(
                                'px-1.5 py-0.5 text-[10px] font-medium rounded',
                                item.type === 'overdue' && 'bg-red-50 text-red-600',
                                item.type === 'high_risk' && 'bg-orange-50 text-orange-600',
                                item.type === 'delayed_batch' && 'bg-amber-50 text-amber-600'
                              )}
                            >
                              {item.type === 'overdue' && '逾期'}
                              {item.type === 'high_risk' && '高风险'}
                              {item.type === 'delayed_batch' && '滞留'}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5 truncate">{item.detail}</p>
                        </div>
                        <span className="text-xs text-gray-400 flex-shrink-0">{item.storeName}</span>
                        <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors flex-shrink-0" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-5">
              <div className="bg-white rounded-xl border border-gray-100 p-6">
                <h3 className="text-base font-semibold text-gray-900 mb-4">各门店问题分布</h3>
                <div className="space-y-3">
                  {reviewByStore.map((storeData) => {
                    const dangerCount = storeData.items.filter((i) => i.severity === 'danger').length;
                    const warningCount = storeData.items.filter((i) => i.severity === 'warning').length;
                    return (
                      <div
                        key={storeData.storeId}
                        onClick={() => handleStoreClick(storeData.storeId)}
                        className="p-3 bg-gray-50/80 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-900">
                            {storeData.storeName}
                          </span>
                          <span className="text-sm font-bold text-gray-700 tabular-nums">
                            {storeData.items.length}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {dangerCount > 0 && (
                            <span className="text-[10px] px-1.5 py-0.5 bg-red-100 text-red-600 rounded">
                              严重 {dangerCount}
                            </span>
                          )}
                          {warningCount > 0 && (
                            <span className="text-[10px] px-1.5 py-0.5 bg-orange-100 text-orange-600 rounded">
                              警告 {warningCount}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2">
              <TrendChart data={trendData} />
            </div>
            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-gray-100 p-6">
                <h3 className="text-base font-semibold text-gray-900 mb-4">
                  风险门店 TOP3
                </h3>
                <div className="space-y-4">
                  {stores
                    .filter((s) => s.completionRate < 90)
                    .sort((a, b) => a.completionRate - b.completionRate)
                    .slice(0, 3)
                    .map((store, index) => (
                      <div
                        key={store.id}
                        className="flex items-center gap-4 p-3 bg-red-50/50 rounded-lg cursor-pointer hover:bg-red-50 transition-colors"
                        onClick={() => handleStoreClick(store.id)}
                      >
                        <span
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                            index === 0
                              ? 'bg-red-500'
                              : index === 1
                              ? 'bg-orange-500'
                              : 'bg-yellow-500'
                          }`}
                        >
                          {index + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {store.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            逾期 {store.weeklyOverdue} 件
                          </p>
                        </div>
                        <span className="text-sm font-semibold text-red-600 tabular-nums">
                          {store.completionRate}%
                        </span>
                      </div>
                    ))}
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-100 p-6">
                <h3 className="text-base font-semibold text-gray-900 mb-4">
                  发放效率分析
                </h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">平均完成率</span>
                      <span className="text-sm font-semibold text-gray-900 tabular-nums">
                        90.7%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: '90.7%' }}
                      ></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">逾期率</span>
                      <span className="text-sm font-semibold text-red-600 tabular-nums">
                        7.4%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-red-500 rounded-full"
                        style={{ width: '7.4%' }}
                      ></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">提前发放率</span>
                      <span className="text-sm font-semibold text-green-600 tabular-nums">
                        2.3%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 rounded-full"
                        style={{ width: '2.3%' }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <StoreTable stores={stores} />
        </>
      )}
    </div>
  );
}
