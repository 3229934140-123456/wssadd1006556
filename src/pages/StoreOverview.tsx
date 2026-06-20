import { useMemo } from 'react';
import { Package, Send, AlertTriangle, Clock, Users, ArrowLeft } from 'lucide-react';
import StatCard from '@/components/common/StatCard';
import StoreTable from '@/components/store-overview/StoreTable';
import TrendChart from '@/components/store-overview/TrendChart';
import { stores, trendData, totalStats } from '@/data/stores';
import { useStore } from '@/store/useStore';
import { patients } from '@/data/patients';
import { batches } from '@/data/batches';
import { useNavigate } from 'react-router-dom';

export default function StoreOverview() {
  const { selectedStore, clearSelectedStore } = useStore();
  const navigate = useNavigate();

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
              {storeBatches.filter((b) => b.status !== 'completed').length >
              0 ? (
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
                    className="flex items-center gap-4 p-3 bg-red-50/50 rounded-lg"
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
    </div>
  );
}
