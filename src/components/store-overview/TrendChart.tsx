import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { TrendData } from '@/types';

interface TrendChartProps {
  data: TrendData[];
}

export default function TrendChart({ data }: TrendChartProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-base font-semibold text-gray-900">近4周发放趋势</h3>
          <p className="text-sm text-gray-500 mt-1">应发、已发、逾期数量对比</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-md">
            近4周
          </button>
          <button className="px-3 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-50 rounded-md transition-colors">
            近8周
          </button>
          <button className="px-3 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-50 rounded-md transition-colors">
            近12周
          </button>
        </div>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F2F3F5" vertical={false} />
            <XAxis
              dataKey="week"
              tick={{ fill: '#86909C', fontSize: 12 }}
              axisLine={{ stroke: '#E5E6EB' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: '#86909C', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #E5E6EB',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
              }}
              labelStyle={{ color: '#1D2129', fontWeight: 600 }}
            />
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ paddingTop: 16 }}
            />
            <Line
              type="monotone"
              dataKey="shouldSend"
              name="应发数量"
              stroke="#165DFF"
              strokeWidth={2.5}
              dot={{ r: 4, fill: '#165DFF', strokeWidth: 2, stroke: '#fff' }}
              activeDot={{ r: 6, fill: '#165DFF', strokeWidth: 2, stroke: '#fff' }}
            />
            <Line
              type="monotone"
              dataKey="sent"
              name="已发数量"
              stroke="#00B42A"
              strokeWidth={2.5}
              dot={{ r: 4, fill: '#00B42A', strokeWidth: 2, stroke: '#fff' }}
              activeDot={{ r: 6, fill: '#00B42A', strokeWidth: 2, stroke: '#fff' }}
            />
            <Line
              type="monotone"
              dataKey="overdue"
              name="逾期数量"
              stroke="#F53F3F"
              strokeWidth={2.5}
              dot={{ r: 4, fill: '#F53F3F', strokeWidth: 2, stroke: '#fff' }}
              activeDot={{ r: 6, fill: '#F53F3F', strokeWidth: 2, stroke: '#fff' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
