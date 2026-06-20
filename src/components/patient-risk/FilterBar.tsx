import { Search, RotateCcw, Filter } from 'lucide-react';
import { stores } from '@/data/stores';

interface FilterBarProps {
  filters: {
    storeId: string;
    overdueDaysMin: string;
    overdueDaysMax: string;
    missedVisitsMin: string;
    remainingAlignersMax: string;
    riskLevel: string;
  };
  onFilterChange: (filters: FilterBarProps['filters']) => void;
  onReset: () => void;
}

export default function FilterBar({
  filters,
  onFilterChange,
  onReset,
}: FilterBarProps) {
  const handleChange = (key: keyof typeof filters, value: string) => {
    onFilterChange({ ...filters, [key]: value });
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <div className="flex items-center gap-2 mb-4">
        <Filter className="w-4 h-4 text-gray-500" />
        <span className="text-sm font-medium text-gray-700">筛选条件</span>
      </div>

      <div className="grid grid-cols-6 gap-4">
        <div>
          <label className="block text-xs text-gray-500 mb-1.5">所属门店</label>
          <select
            value={filters.storeId}
            onChange={(e) => handleChange('storeId', e.target.value)}
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
          <label className="block text-xs text-gray-500 mb-1.5">逾期天数</label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              placeholder="最小"
              value={filters.overdueDaysMin}
              onChange={(e) => handleChange('overdueDaysMin', e.target.value)}
              className="w-full h-9 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-blue-300 focus:ring-2 focus:ring-blue-50 transition-all"
            />
            <span className="text-gray-400 text-xs">-</span>
            <input
              type="number"
              placeholder="最大"
              value={filters.overdueDaysMax}
              onChange={(e) => handleChange('overdueDaysMax', e.target.value)}
              className="w-full h-9 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-blue-300 focus:ring-2 focus:ring-blue-50 transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1.5">缺诊次数</label>
          <input
            type="number"
            placeholder="最小次数"
            value={filters.missedVisitsMin}
            onChange={(e) => handleChange('missedVisitsMin', e.target.value)}
            className="w-full h-9 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-blue-300 focus:ring-2 focus:ring-blue-50 transition-all"
          />
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1.5">剩余牙套</label>
          <input
            type="number"
            placeholder="小于等于"
            value={filters.remainingAlignersMax}
            onChange={(e) =>
              handleChange('remainingAlignersMax', e.target.value)
            }
            className="w-full h-9 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-blue-300 focus:ring-2 focus:ring-blue-50 transition-all"
          />
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1.5">风险等级</label>
          <select
            value={filters.riskLevel}
            onChange={(e) => handleChange('riskLevel', e.target.value)}
            className="w-full h-9 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:bg-white focus:border-blue-300 focus:ring-2 focus:ring-blue-50 transition-all"
          >
            <option value="">全部等级</option>
            <option value="high">高风险</option>
            <option value="medium">中风险</option>
            <option value="low">低风险</option>
          </select>
        </div>

        <div className="flex items-end gap-2">
          <button
            onClick={onReset}
            className="flex-1 h-9 px-4 flex items-center justify-center gap-1.5 text-sm text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            重置
          </button>
          <button className="flex-1 h-9 px-4 flex items-center justify-center gap-1.5 text-sm text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors">
            <Search className="w-4 h-4" />
            查询
          </button>
        </div>
      </div>
    </div>
  );
}
