import { useState, useMemo, useEffect } from 'react';
import FilterBar from '@/components/patient-risk/FilterBar';
import PatientList from '@/components/patient-risk/PatientList';
import PatientDrawer from '@/components/patient-risk/PatientDrawer';
import { patients } from '@/data/patients';
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
  ChevronDown,
  X,
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

type TaskGroup = 'overdue' | 'today' | 'pending';

export default function PatientRisk() {
  const { selectedStoreId, setSelectedStore } = useStore();
  const [viewMode, setViewMode] = useState<'list' | 'tasks' | 'cs'>('list');
  const [filters, setFilters] = useState(initialFilters);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedCS, setSelectedCS] = useState<string | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Record<TaskGroup, boolean>>({
    overdue: true,
    today: true,
    pending: true,
  });

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
      if (filters.overdueDaysMin && patient.overdueDays < parseInt(filters.overdueDaysMin)) return false;
      if (filters.overdueDaysMax && patient.overdueDays > parseInt(filters.overdueDaysMax)) return false;
      if (filters.missedVisitsMin && patient.missedVisits < parseInt(filters.missedVisitsMin)) return false;
      if (filters.remainingAlignersMax && patient.remainingAligners > parseInt(filters.remainingAlignersMax)) return false;
      if (filters.riskLevel && patient.riskLevel !== filters.riskLevel) return false;
      return true;
    });
  }, [filters]);

  const handleReset = () => {
    setFilters(initialFilters);
    setSelectedStore(null);
    setSelectedCS(null);
  };

  const handleFilterChange = (newFilters: typeof initialFilters) => {
    setFilters(newFilters);
    if (newFilters.storeId !== filters.storeId) {
      setSelectedStore(newFilters.storeId || null);
    }
  };

  const getNextFollowUpDate = (patient: Patient) => {
    const lastDate = new Date(patient.lastCommunication);
    const daysToAdd = patient.riskLevel === 'high' ? 2 : patient.riskLevel === 'medium' ? 5 : 7;
    lastDate.setDate(lastDate.getDate() + daysToAdd);
    return lastDate.toISOString().split('T')[0];
  };

  const getTaskGroup = (patient: Patient): TaskGroup => {
    const nextFollowUp = getNextFollowUpDate(patient);
    const today = new Date('2026-06-20');
    const followUpDate = new Date(nextFollowUp);
    const daysUntil = Math.ceil((followUpDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (daysUntil < 0) return 'overdue';
    if (daysUntil === 0) return 'today';
    return 'pending';
  };

  const taskPatients = useMemo(() => {
    let list = filteredPatients
      .filter((p) => p.riskLevel !== 'low' || p.overdueDays > 0);
    if (selectedCS) {
      list = list.filter((p) => p.customerService === selectedCS);
    }
    return list.sort((a, b) => b.overdueDays - a.overdueDays);
  }, [filteredPatients, selectedCS]);

  const taskGroups = useMemo(() => {
    const overdue: Patient[] = [];
    const today: Patient[] = [];
    const pending: Patient[] = [];

    taskPatients.forEach((p) => {
      const group = getTaskGroup(p);
      if (group === 'overdue') overdue.push(p);
      else if (group === 'today') today.push(p);
      else pending.push(p);
    });

    return { overdue, today, pending };
  }, [taskPatients]);

  const stats = useMemo(() => {
    const data = filteredPatients;
    return {
      high: data.filter((p) => p.riskLevel === 'high').length,
      medium: data.filter((p) => p.riskLevel === 'medium').length,
      overdue: data.filter((p) => p.overdueDays > 0).length,
      low: data.filter((p) => p.riskLevel === 'low').length,
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
    return Array.from(csMap.values()).sort((a, b) => b.highRiskCount - a.highRiskCount);
  }, [filteredPatients]);

  const toggleGroup = (group: TaskGroup) => {
    setExpandedGroups((prev) => ({ ...prev, [group]: !prev[group] }));
  };

  const handleCSClick = (csName: string) => {
    if (selectedCS === csName) {
      setSelectedCS(null);
    } else {
      setSelectedCS(csName);
      setViewMode('tasks');
    }
  };

  const viewTabs = [
    { key: 'list', label: '患者列表', icon: Users },
    { key: 'tasks', label: '跟进任务', icon: ListTodo },
    { key: 'cs', label: '客服绩效', icon: BarChart3 },
  ];

  const groupConfig: { key: TaskGroup; label: string; color: string; bgColor: string; borderColor: string; icon: typeof AlertTriangle }[] = [
    { key: 'overdue', label: '已逾期', color: 'text-red-600', bgColor: 'bg-red-50', borderColor: 'border-red-200', icon: AlertTriangle },
    { key: 'today', label: '今天到期', color: 'text-orange-600', bgColor: 'bg-orange-50', borderColor: 'border-orange-200', icon: Clock },
    { key: 'pending', label: '待处理', color: 'text-blue-600', bgColor: 'bg-blue-50', borderColor: 'border-blue-200', icon: ListTodo },
  ];

  const renderTaskRow = (patient: Patient) => {
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
        className="px-6 py-3.5 hover:bg-blue-50/30 transition-colors cursor-pointer group"
      >
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <div
              className={cn(
                'absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white',
                patient.riskLevel === 'high' && 'bg-red-500 animate-pulse',
                patient.riskLevel === 'medium' && 'bg-orange-500',
                patient.riskLevel === 'low' && 'bg-green-500'
              )}
            ></div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-semibold text-gray-900">{patient.name}</h4>
              <span
                className={cn(
                  'px-1.5 py-0.5 text-[11px] font-medium rounded border',
                  patient.riskLevel === 'high' && 'bg-red-50 text-red-600 border-red-200',
                  patient.riskLevel === 'medium' && 'bg-orange-50 text-orange-600 border-orange-200',
                  patient.riskLevel === 'low' && 'bg-green-50 text-green-600 border-green-200'
                )}
              >
                {patient.riskLevel === 'high' ? '高' : patient.riskLevel === 'medium' ? '中' : '低'}
              </span>
              <span className="text-xs text-gray-400">{patient.storeName}</span>
            </div>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-xs text-gray-500">客服：{patient.customerService}</span>
              <span className="text-xs text-gray-300">|</span>
              <span className="text-xs text-gray-500">医生：{patient.doctor}</span>
            </div>
          </div>

          <div className="flex items-center gap-5">
            <div className="text-center w-14">
              <p
                className={cn(
                  'text-base font-bold tabular-nums',
                  patient.overdueDays >= 7 && 'text-red-600',
                  patient.overdueDays >= 3 && patient.overdueDays < 7 && 'text-orange-600',
                  patient.overdueDays < 3 && 'text-gray-700'
                )}
              >
                {patient.overdueDays}
              </p>
              <p className="text-[10px] text-gray-400">逾期</p>
            </div>

            <div className="w-px h-8 bg-gray-100"></div>

            <div className="w-36">
              <div className="flex items-center gap-1.5 mb-0.5">
                <Calendar className="w-3 h-3 text-gray-400" />
                <span className="text-[11px] text-gray-500">{patient.lastCommunication}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Phone className="w-3 h-3 text-gray-400" />
                <span
                  className={cn(
                    'text-[11px] font-medium',
                    isOverdueFollowUp ? 'text-red-600' : 'text-blue-600'
                  )}
                >
                  {isOverdueFollowUp
                    ? `逾期${Math.abs(daysUntilFollowUp)}天`
                    : `跟进：${nextFollowUp.slice(5)}`}
                </span>
              </div>
            </div>

            <div className="w-px h-8 bg-gray-100"></div>

            <div className="w-28">
              <p className="text-[11px] text-gray-600 line-clamp-2">
                {patient.lastCommunicationResult}
              </p>
            </div>
          </div>

          <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
        </div>
      </div>
    );
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

      {selectedCS && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">当前筛选客服：</span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-50 text-purple-700 text-sm font-medium rounded-full border border-purple-200">
            {selectedCS}
            <button
              onClick={() => setSelectedCS(null)}
              className="hover:bg-purple-100 rounded-full p-0.5 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </span>
        </div>
      )}

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
              <h3 className="text-base font-semibold text-gray-900">跟进任务列表</h3>
              <p className="text-sm text-gray-500 mt-0.5">
                共 {taskPatients.length} 位患者需要跟进
                {selectedCS && ` · ${selectedCS}`}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {taskGroups.overdue.length > 0 && (
                <span className="px-2.5 py-1 text-xs font-medium bg-red-50 text-red-600 rounded-full border border-red-200">
                  已逾期 {taskGroups.overdue.length}
                </span>
              )}
              {taskGroups.today.length > 0 && (
                <span className="px-2.5 py-1 text-xs font-medium bg-orange-50 text-orange-600 rounded-full border border-orange-200">
                  今天到期 {taskGroups.today.length}
                </span>
              )}
              {taskGroups.pending.length > 0 && (
                <span className="px-2.5 py-1 text-xs font-medium bg-blue-50 text-blue-600 rounded-full border border-blue-200">
                  待处理 {taskGroups.pending.length}
                </span>
              )}
            </div>
          </div>

          <div>
            {groupConfig.map((group) => {
              const items = taskGroups[group.key];
              if (items.length === 0) return null;
              const isExpanded = expandedGroups[group.key];
              const GroupIcon = group.icon;

              return (
                <div key={group.key}>
                  <button
                    onClick={() => toggleGroup(group.key)}
                    className={cn(
                      'w-full px-6 py-3 flex items-center justify-between transition-colors',
                      group.bgColor
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <ChevronDown
                        className={cn(
                          'w-4 h-4 transition-transform',
                          !isExpanded && '-rotate-90'
                        )}
                      />
                      <GroupIcon className={cn('w-4 h-4', group.color)} />
                      <span className={cn('text-sm font-semibold', group.color)}>
                        {group.label}
                      </span>
                      <span className={cn(
                        'px-2 py-0.5 text-xs font-bold rounded-full tabular-nums',
                        group.key === 'overdue' && 'bg-red-100 text-red-700',
                        group.key === 'today' && 'bg-orange-100 text-orange-700',
                        group.key === 'pending' && 'bg-blue-100 text-blue-700',
                      )}>
                        {items.length}
                      </span>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="divide-y divide-gray-50">
                      {items.map(renderTaskRow)}
                    </div>
                  )}
                </div>
              );
            })}

            {taskPatients.length === 0 && (
              <div className="py-16 text-center text-gray-400">
                <ListTodo className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">暂无跟进任务</p>
              </div>
            )}
          </div>
        </div>
      )}

      {viewMode === 'cs' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-6">
            {csPerformance.map((cs, index) => (
              <div
                key={cs.name}
                onClick={() => handleCSClick(cs.name)}
                className={cn(
                  'bg-white rounded-xl border p-5 hover:shadow-md transition-all duration-300 cursor-pointer',
                  selectedCS === cs.name ? 'border-purple-300 ring-2 ring-purple-100' : 'border-gray-100'
                )}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold">{cs.name.slice(0, 1)}</span>
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-gray-900">{cs.name}</h3>
                      <p className="text-xs text-gray-400">{cs.storeName}</p>
                    </div>
                  </div>
                  <div className="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center text-sm font-semibold text-gray-600">
                    {index + 1}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <p className="text-xl font-bold text-gray-900 tabular-nums">{cs.totalPatients}</p>
                    <p className="text-xs text-gray-500 mt-1">负责患者</p>
                  </div>
                  <div className="bg-red-50 rounded-lg p-3 text-center">
                    <p className="text-xl font-bold text-red-600 tabular-nums">{cs.highRiskCount}</p>
                    <p className="text-xs text-gray-500 mt-1">高风险</p>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-3 text-center">
                    <p className="text-xl font-bold text-orange-600 tabular-nums">{cs.overdueCount}</p>
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
                        style={{ width: `${(cs.pendingCount / cs.totalPatients) * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">最近跟进日期</span>
                    <span className="text-gray-700 font-medium">{cs.lastFollowUp}</span>
                  </div>
                </div>

                <div className="mt-4 py-2 text-sm text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors flex items-center justify-center gap-1">
                  {selectedCS === cs.name ? '取消筛选' : '查看跟进任务'}
                  <ChevronRight className="w-4 h-4" />
                </div>
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
