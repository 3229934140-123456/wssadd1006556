import { useState, useMemo, useEffect } from 'react';
import FilterBar from '@/components/patient-risk/FilterBar';
import PatientList from '@/components/patient-risk/PatientList';
import PatientDrawer from '@/components/patient-risk/PatientDrawer';
import { patients } from '@/data/patients';
import { stores } from '@/data/stores';
import { Patient } from '@/types';
import {
  Users,
  AlertTriangle,
  Clock,
  UserCheck,
  Phone,
  Calendar,
  User,
  ListTodo,
  BarChart3,
  ChevronRight,
} from 'lucide-react';
import StatCard from '@/components/common/StatCard';
import { useStore } from '@/store/useStore';
import { cn } from '@/lib/utils';

const initialFilters = {
  storeId: '',
  overdueDaysMin: '',
  overdueDaysMax: '',
  missedVisitsMin: '',
  remainingAlignersMax: '',
  riskLevel: '',
};

interface CSPerformance {
  name: string;
  storeName: string;
  totalPatients: number;
  highRiskCount: number;
  overdueCount: number;
  lastFollowUp: string;
  pendingCount: number;
}

export default function PatientRisk() {
  const { selectedStoreId, setSelectedStore } = useStore();
  const [viewMode, setViewMode] = useState<'list' | 'tasks' | 'cs'>('list');
  const [filters, setFilters] = useState(initialFilters);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  useEffect(() => {
    if (selectedStoreId) {
      setFilters((prev) => ({ ...prev, storeId: selectedStoreId }));
    } else {
      setFilters((prev) => ({ ...prev, storeId: '' }));
    }
  }, [selectedStoreId]);

  const filteredPatients = useMemo(() => {
    return patients.filter((patient) => {
      if (filters.storeId && patient.storeId !== filters.storeId) return false;

      if (
        filters.overdueDaysMin &&
        patient.overdueDays < parseInt(filters.overdueDaysMin)
      )
        return false;

      if (
        filters.overdueDaysMax &&
        patient.overdueDays > parseInt(filters.overdueDaysMax)
      )
        return false;

      if (
        filters.missedVisitsMin &&
        patient.missedVisits < parseInt(filters.missedVisitsMin)
      )
        return false;

      if (
        filters.remainingAlignersMax &&
        patient.remainingAligners > parseInt(filters.remainingAlignersMax)
      )
        return false;

      if (filters.riskLevel && patient.riskLevel !== filters.riskLevel)
        return false;

      return true;
    });
  }, [filters]);

  const handleReset = () => {
    setFilters(initialFilters);
    setSelectedStore(null);
  };

  const handleFilterChange = (newFilters: typeof initialFilters) => {
    setFilters(newFilters);
    if (newFilters.storeId !== filters.storeId) {
      setSelectedStore(newFilters.storeId || null);
    }
  };

  const stats = useMemo(() => {
    const data = filteredPatients;
    return {
      high: data.filter((p) => p.riskLevel === 'high').length,
      medium: data.filter((p) => p.riskLevel === 'medium').length,
      overdue: data.filter((p) => p.overdueDays > 0).length,
      low: data.filter((p) => p.riskLevel === 'low').length,
      total: data.length,
    };
  }, [filteredPatients]);

  const csPerformance = useMemo(() => {
    const csMap = new Map<string, CSPerformance>();

    filteredPatients.forEach((patient) => {
      const key = patient.customerService;
      if (!csMap.has(key)) {
        csMap.set(key, {
          name: patient.customerService,
          storeName: patient.storeName,
          totalPatients: 0,
          highRiskCount: 0,
          overdueCount: 0,
          lastFollowUp: patient.lastCommunication,
          pendingCount: 0,
        });
      }
      const cs = csMap.get(key)!;
      cs.totalPatients++;
      if (patient.riskLevel === 'high') cs.highRiskCount++;
      if (patient.overdueDays > 0) cs.overdueCount++;
      if (patient.overdueDays > 0 || patient.riskLevel !== 'low') cs.pendingCount++;
      if (patient.lastCommunication < cs.lastFollowUp) {
        cs.lastFollowUp = patient.lastCommunication;
      }
    });

    return Array.from(csMap.values()).sort(
      (a, b) => b.highRiskCount - a.highRiskCount
    );
  }, [filteredPatients]);

  const taskPatients = useMemo(() => {
    return filteredPatients
      .filter((p) => p.riskLevel !== 'low' || p.overdueDays > 0)
      .sort((a, b) => b.overdueDays - a.overdueDays);
  }, [filteredPatients]);

  const viewTabs = [
    { key: 'list', label: '患者列表', icon: Users },
    { key: 'tasks', label: '跟进任务', icon: ListTodo },
    { key: 'cs', label: '客服绩效', icon: BarChart3 },
  ];

  const getNextFollowUpDate = (patient: Patient) => {
    const lastDate = new Date(patient.lastCommunication);
    const daysToAdd = patient.riskLevel === 'high' ? 2 : patient.riskLevel === 'medium' ? 5 : 7;
    lastDate.setDate(lastDate.getDate() + daysToAdd);
    return lastDate.toISOString().split('T')[0];
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">患者风险</h2>
          <p className="text-sm text-gray-500 mt-1">
            监控患者佩戴依从性，及时干预高风险病例
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-white rounded-xl border border-gray-100 p-1.5 flex">
            {viewTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = viewMode === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setViewMode(tab.key as typeof viewMode)}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200',
                    isActive
                      ? 'bg-blue-500 text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
          <button className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
            导出列表
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-5">
        <StatCard
          title="高风险患者"
          value={stats.high}
          unit="人"
          icon={<AlertTriangle className="w-6 h-6" />}
          color="red"
        />
        <StatCard
          title="中风险患者"
          value={stats.medium}
          unit="人"
          icon={<Clock className="w-6 h-6" />}
          color="orange"
        />
        <StatCard
          title="逾期患者"
          value={stats.overdue}
          unit="人"
          icon={<Users className="w-6 h-6" />}
          color="blue"
        />
        <StatCard
          title="低风险患者"
          value={stats.low}
          unit="人"
          icon={<UserCheck className="w-6 h-6" />}
          color="green"
        />
      </div>

      <FilterBar
        filters={filters}
        onFilterChange={handleFilterChange}
        onReset={handleReset}
      />

      {viewMode === 'list' && (
        <PatientList
          patients={filteredPatients}
          onPatientClick={setSelectedPatient}
        />
      )}

      {viewMode === 'tasks' && (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-gray-900">
                跟进任务列表
              </h3>
              <p className="text-sm text-gray-500 mt-0.5">
                共 {taskPatients.length} 位患者需要跟进
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-md transition-colors">
                按逾期天数
              </button>
              <button className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-md transition-colors">
                按下次跟进
              </button>
            </div>
          </div>

          <div className="divide-y divide-gray-50">
            {taskPatients.map((patient) => {
              const nextFollowUp = getNextFollowUpDate(patient);
              const today = new Date('2026-06-20');
              const followUpDate = new Date(nextFollowUp);
              const daysUntilFollowUp = Math.ceil(
                (followUpDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
              );
              const isOverdueFollowUp = daysUntilFollowUp < 0;

              return (
                <div
                  key={patient.id}
                  onClick={() => setSelectedPatient(patient)}
                  className="px-6 py-4 hover:bg-blue-50/30 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-white" />
                      </div>
                      <div
                        className={cn(
                          'absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-white',
                          patient.riskLevel === 'high' &&
                            'bg-red-500 animate-pulse',
                          patient.riskLevel === 'medium' && 'bg-orange-500',
                          patient.riskLevel === 'low' && 'bg-green-500'
                        )}
                      ></div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <h4 className="text-sm font-semibold text-gray-900">
                          {patient.name}
                        </h4>
                        <span
                          className={cn(
                            'px-2 py-0.5 text-xs font-medium rounded-md border',
                            patient.riskLevel === 'high' &&
                              'bg-red-50 text-red-600 border-red-200',
                            patient.riskLevel === 'medium' &&
                              'bg-orange-50 text-orange-600 border-orange-200',
                            patient.riskLevel === 'low' &&
                              'bg-green-50 text-green-600 border-green-200'
                          )}
                        >
                          {patient.riskLevel === 'high'
                            ? '高风险'
                            : patient.riskLevel === 'medium'
                            ? '中风险'
                            : '低风险'}
                        </span>
                        <span className="text-xs text-gray-400">
                          {patient.storeName}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-gray-400">主治医生</span>
                          <span className="text-xs text-gray-600 font-medium">
                            {patient.doctor}
                          </span>
                        </div>
                        <div className="w-px h-3 bg-gray-200"></div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-gray-400">跟进客服</span>
                          <span className="text-xs text-gray-600 font-medium">
                            {patient.customerService}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <p
                          className={cn(
                            'text-lg font-bold tabular-nums',
                            patient.overdueDays >= 7 && 'text-red-600',
                            patient.overdueDays >= 3 &&
                              patient.overdueDays < 7 &&
                              'text-orange-600',
                            patient.overdueDays < 3 && 'text-gray-700'
                          )}
                        >
                          {patient.overdueDays}
                        </p>
                        <p className="text-xs text-gray-400">逾期天数</p>
                      </div>

                      <div className="w-px h-8 bg-gray-100"></div>

                      <div className="w-40">
                        <div className="flex items-center gap-2 mb-1">
                          <Calendar className="w-3.5 h-3.5 text-gray-400" />
                          <span className="text-xs text-gray-500">
                            最近沟通：{patient.lastCommunication}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 text-gray-400" />
                          <span
                            className={cn(
                              'text-xs font-medium',
                              isOverdueFollowUp
                                ? 'text-red-600'
                                : 'text-blue-600'
                            )}
                          >
                            {isOverdueFollowUp
                              ? `跟进已逾期 ${Math.abs(daysUntilFollowUp)} 天`
                              : `下次跟进：${nextFollowUp}`}
                          </span>
                        </div>
                      </div>

                      <div className="w-px h-8 bg-gray-100"></div>

                      <div className="w-32">
                        <p className="text-xs text-gray-400 mb-1">沟通结果</p>
                        <p className="text-xs text-gray-600 line-clamp-2">
                          {patient.lastCommunicationResult}
                        </p>
                      </div>
                    </div>

                    <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-gray-500 transition-colors" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {viewMode === 'cs' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-6">
            {csPerformance.map((cs, index) => (
              <div
                key={cs.name}
                className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md transition-all duration-300"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold">
                        {cs.name.slice(0, 1)}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-gray-900">
                        {cs.name}
                      </h3>
                      <p className="text-xs text-gray-400">{cs.storeName}</p>
                    </div>
                  </div>
                  <div className="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center text-sm font-semibold text-gray-600">
                    {index + 1}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <p className="text-xl font-bold text-gray-900 tabular-nums">
                      {cs.totalPatients}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">负责患者</p>
                  </div>
                  <div className="bg-red-50 rounded-lg p-3 text-center">
                    <p className="text-xl font-bold text-red-600 tabular-nums">
                      {cs.highRiskCount}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">高风险</p>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-3 text-center">
                    <p className="text-xl font-bold text-orange-600 tabular-nums">
                      {cs.overdueCount}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">逾期</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs text-gray-500">待跟进任务</span>
                      <span className="text-xs font-medium text-blue-600 tabular-nums">
                        {cs.pendingCount} 人
                      </span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full"
                        style={{
                          width: `${(cs.pendingCount / cs.totalPatients) * 100}%`,
                        }}
                      ></div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">最近跟进日期</span>
                    <span className="text-gray-700 font-medium">
                      {cs.lastFollowUp}
                    </span>
                  </div>
                </div>

                <button className="w-full mt-4 py-2 text-sm text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center justify-center gap-1">
                  查看患者列表
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <PatientDrawer
        patient={selectedPatient}
        onClose={() => setSelectedPatient(null)}
      />
    </div>
  );
}
