import { Package, Send, AlertTriangle, Clock } from 'lucide-react';
import StatCard from '@/components/common/StatCard';
import StoreTable from '@/components/store-overview/StoreTable';
import TrendChart from '@/components/store-overview/TrendChart';
import { stores, trendData, totalStats } from '@/data/stores';

export default function StoreOverview() {
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
