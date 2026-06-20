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
  StickyNote,
  Plus,
  X,
  CheckCircle2,
  CircleDot,
  User,
  CalendarDays,
  MapPin,
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
import { MeetingNote, WeeklyOverdueItem } from '@/types';

type ViewMode = 'overview' | 'review';
type SeverityFilter = 'all' | 'severe';

interface ReviewGroup {
  storeId: string;
  storeName: string;
  overdueItems: WeeklyOverdueItem[];
  overdueQty: number;
  highRiskPatients: typeof patients;
  anomalyBatches: typeof batches;
  totalIssues: number;
  severeCount: number;
}

const overdueStatusMap: Record<WeeklyOverdueItem['status'], { label: string; className: string }> = {
  pending: { label: '待处理', className: 'bg-gray-100 text-gray-600 border-gray-200' },
  processing: { label: '处理中', className: 'bg-blue-50 text-blue-600 border-blue-200' },
  completed: { label: '已完成', className: 'bg-green-50 text-green-600 border-green-200' },
};

const assignees = [
  '李督导', '王总部', '广州客服-林芳', '广州客服-黄丽',
  '杭州客服-陈雅', '杭州客服-钱敏', '武汉客服-冯洁', '武汉客服-曹颖',
  '北京客服-李明', '北京客服-王静', '门店店长',
];

export default function StoreOverview() {
  const {
    selectedStore,
    setSelectedStore,
    clearSelectedStore,
    meetingNotes,
    addMeetingNote,
    updateOverdueItem,
    overdueItems,
    batchAnomalies,
  } = useStore();

  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<ViewMode>('overview');
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('all');
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteTarget, setNoteTarget] = useState<{ type: 'store' | 'patient' | 'batch'; id: string; storeId: string; title: string } | null>(null);
  const [noteContent, setNoteContent] = useState('');
  const [noteActions, setNoteActions] = useState('');
  const [noteAssignee, setNoteAssignee] = useState('');
  const [noteDueDate, setNoteDueDate] = useState('');
  const [expandedStores, setExpandedStores] = useState<Record<string, boolean>>({});

  const storePatients = useMemo(() => {
    if (!selectedStore) return [];
    return patients.filter((p) => p.storeId === selectedStore.id);
  }, [selectedStore]);

  const storeBatches = useMemo(() => {
    if (!selectedStore) return [];
    return batches.filter((b) => b.storeId === selectedStore.id);
  }, [selectedStore]);

  const storeOverdueItems = useMemo(() => {
    if (!selectedStore) return [];
    return overdueItems.get(selectedStore.id) || selectedStore.overdueItems || [];
  }, [selectedStore, overdueItems]);

  const highRiskCount = useMemo(() => {
    return storePatients.filter((p) => p.riskLevel === 'high').length;
  }, [storePatients]);

  const warningBatches = useMemo(() => {
    return storeBatches.filter(
      (b) => b.warningLevel !== 'normal' && b.status !== 'completed'
    ).length;
  }, [storeBatches]);

  const currentStoreNotes = useMemo(() => {
    if (!selectedStore) return [];
    return meetingNotes.filter((n) => n.storeId === selectedStore.id);
  }, [selectedStore, meetingNotes]);

  const handleStoreClick = (storeId: string) => {
    setSelectedStore(storeId);
  };

  const handleItemNavigate = (targetType: 'patient' | 'batch', targetId: string, storeId: string) => {
    setSelectedStore(storeId);
    navigate(targetType === 'batch' ? '/batches' : '/patients');
  };

  const handleOverdueStatusChange = (storeId: string, item: WeeklyOverdueItem, newStatus: WeeklyOverdueItem['status']) => {
    updateOverdueItem(storeId, { ...item, status: newStatus });
  };

  const openNoteModal = (target: typeof noteTarget) => {
    setNoteTarget(target);
    setNoteContent('');
    setNoteActions('');
    setNoteAssignee('');
    setNoteDueDate('');
    setShowNoteModal(true);
  };

  const handleSaveNote = () => {
    if (!noteTarget || !noteContent.trim()) return;
    addMeetingNote({
      storeId: noteTarget.storeId,
      targetType: noteTarget.type,
      targetId: noteTarget.id,
      content: noteContent,
      actionItems: noteActions.split('\n').filter(Boolean),
      assignees: noteAssignee ? [noteAssignee] : [],
      dueDate: noteDueDate || undefined,
      createdBy: '周会',
      status: 'open',
    });
    setShowNoteModal(false);
    setNoteTarget(null);
  };

  // 构建复盘议程
  const reviewGroups = useMemo(() => {
    const targetStores = selectedStore ? [selectedStore] : stores;
    const groups: ReviewGroup[] = [];

    targetStores.forEach((store) => {
      const overdues = overdueItems.get(store.id) || store.overdueItems || [];
      const activeOverdues = overdues.filter((o) => o.status !== 'completed');
      const severeOverdues = activeOverdues.filter((o) => {
        const due = new Date(o.dueDate);
        const today = new Date('2026-06-20');
        return (today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24) >= 5;
      });

      const highRisk = patients.filter(
        (p) => p.storeId === store.id && p.riskLevel === 'high'
      );

      const anomalies = batches.filter((b) => {
        if (b.storeId !== store.id) return false;
        const anom = batchAnomalies.get(b.id) || b.anomaly;
        return !!anom && anom.status !== 'closed';
      });

      const totalIssues = activeOverdues.length + highRisk.length + anomalies.length;
      const severeCount =
        severeOverdues.length +
        highRisk.filter((p) => p.overdueDays >= 7).length +
        anomalies.filter((b) => b.warningLevel === 'danger').length;

      if (severityFilter === 'severe' && severeCount === 0) return;

      groups.push({
        storeId: store.id,
        storeName: store.name,
        overdueItems: activeOverdues,
        overdueQty: activeOverdues.reduce((s, o) => s + o.quantity, 0),
        highRiskPatients: highRisk,
        anomalyBatches: anomalies,
        totalIssues,
        severeCount,
      });
    });

    return groups.sort(
      (a, b) =>
        b.totalIssues - a.totalIssues || b.severeCount - a.severeCount
    );
  }, [selectedStore, severityFilter, batchAnomalies, overdueItems]);

  const reviewStats = useMemo(() => {
    let overdueQty = 0;
    let overdueCount = 0;
    let highRiskCount = 0;
    let anomalyCount = 0;

    reviewGroups.forEach((g) => {
      overdueCount += g.overdueItems.length;
      overdueQty += g.overdueQty;
      highRiskCount += g.highRiskPatients.length;
      anomalyCount += g.anomalyBatches.length;
    });

    return { overdueQty, overdueCount, highRiskCount, anomalyCount };
  }, [reviewGroups]);

  const toggleStoreExpand = (storeId: string) => {
    setExpandedStores((prev) => ({ ...prev, [storeId]: !prev[storeId] }));
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
              onClick={() =>
                openNoteModal({
                  type: 'store',
                  id: selectedStore.id,
                  storeId: selectedStore.id,
                  title: selectedStore.name,
                })
              }
              className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              <StickyNote className="w-4 h-4" />
              门店备注
              {currentStoreNotes.length > 0 && (
                <span className="w-5 h-5 bg-blue-500 text-white rounded-full text-xs flex items-center justify-center">
                  {currentStoreNotes.length}
                </span>
              )}
            </button>
            <button
              onClick={() =>
                setViewMode(viewMode === 'review' ? 'overview' : 'review')
              }
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
          <div className="space-y-5">
            <div className="grid grid-cols-3 gap-5">
              <div className="bg-white rounded-xl border border-gray-100 p-5">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm text-gray-500">逾期未发件数</p>
                    <p className="text-3xl font-bold text-red-600 tabular-nums mt-2">
                      {reviewStats.overdueQty}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center text-white">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                </div>
                <p className="text-xs text-gray-400">
                  {storeOverdueItems.filter((o) => o.status !== 'completed').length}{' '}
                  位患者待跟进
                </p>
              </div>
              <div className="bg-white rounded-xl border border-gray-100 p-5">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm text-gray-500">高风险患者</p>
                    <p className="text-3xl font-bold text-orange-600 tabular-nums mt-2">
                      {reviewStats.highRiskCount}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center text-white">
                    <Users className="w-6 h-6" />
                  </div>
                </div>
                <p className="text-xs text-gray-400">
                  其中逾期7天以上{' '}
                  {storePatients.filter((p) => p.riskLevel === 'high' && p.overdueDays >= 7).length}{' '}
                  人
                </p>
              </div>
              <div className="bg-white rounded-xl border border-gray-100 p-5">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm text-gray-500">异常批次</p>
                    <p className="text-3xl font-bold text-amber-600 tabular-nums mt-2">
                      {reviewStats.anomalyCount}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center text-white">
                    <Flag className="w-6 h-6" />
                  </div>
                </div>
                <p className="text-xs text-gray-400">
                  含待分派、处理中状态
                </p>
              </div>
            </div>

            {currentStoreNotes.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <StickyNote className="w-4 h-4 text-blue-500" />
                    <h3 className="text-base font-semibold text-gray-900">
                      周会备注（{currentStoreNotes.length}）
                    </h3>
                  </div>
                  <button
                    onClick={() =>
                      openNoteModal({
                        type: 'store',
                        id: selectedStore.id,
                        storeId: selectedStore.id,
                        title: selectedStore.name,
                      })
                    }
                    className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    新增
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {currentStoreNotes.map((n) => (
                    <div
                      key={n.id}
                      className="p-3 bg-blue-50/50 rounded-lg border border-blue-100"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs text-blue-600 font-medium">
                          {n.createdBy}
                        </span>
                        <span className="text-xs text-gray-400">{n.createdAt}</span>
                      </div>
                      <p className="text-sm text-gray-700">{n.content}</p>
                      {n.actionItems.length > 0 && (
                        <ul className="mt-2 space-y-1">
                          {n.actionItems.map((ai, i) => (
                            <li
                              key={i}
                              className="flex items-start gap-1 text-xs text-gray-600"
                            >
                              <CheckCircle2 className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                              {ai}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {storeOverdueItems.filter((o) => o.status !== 'completed').length > 0 && (
              <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-gray-900">
                      逾期未发明细
                    </h3>
                    <p className="text-sm text-gray-500 mt-0.5">
                      共{' '}
                      {storeOverdueItems.filter((o) => o.status !== 'completed').length}{' '}
                      位患者，累计{' '}
                      {storeOverdueItems
                        .filter((o) => o.status !== 'completed')
                        .reduce((s, o) => s + o.quantity, 0)}{' '}
                      件
                    </p>
                  </div>
                </div>
                <div className="divide-y divide-gray-50">
                  {storeOverdueItems
                    .filter((o) => o.status !== 'completed')
                    .map((item) => {
                      const due = new Date(item.dueDate);
                      const today = new Date('2026-06-20');
                      const daysLate = Math.floor(
                        (today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24)
                      );
                      const isSevere = daysLate >= 5;
                      return (
                        <div
                          key={item.id}
                          className={cn(
                            'px-6 py-3.5 hover:bg-blue-50/30 transition-colors group',
                            isSevere && 'bg-red-50/40'
                          )}
                        >
                          <div className="flex items-center gap-4">
                            <div
                              className={cn(
                                'w-8 h-8 rounded-lg flex items-center justify-center',
                                isSevere
                                  ? 'bg-red-100 text-red-600'
                                  : 'bg-orange-100 text-orange-600'
                              )}
                            >
                              <AlertTriangle className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-gray-900">
                                  {item.patientName}
                                </span>
                                {isSevere && (
                                  <span className="text-[10px] px-1.5 py-0.5 bg-red-100 text-red-700 rounded font-medium">
                                    严重
                                  </span>
                                )}
                                <span
                                  className={cn(
                                    'px-1.5 py-0.5 text-[10px] font-medium rounded border',
                                    overdueStatusMap[item.status].className
                                  )}
                                >
                                  {overdueStatusMap[item.status].label}
                                </span>
                              </div>
                              <p className="text-xs text-gray-500 mt-0.5">
                                应发 {item.quantity} 件 · 到期 {item.dueDate} · 逾期{' '}
                                {daysLate} 天
                                {item.note && ` · ${item.note}`}
                              </p>
                            </div>

                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-1.5">
                                <User className="w-3.5 h-3.5 text-gray-400" />
                                <span className="text-xs text-gray-600">
                                  {item.assignee}
                                </span>
                              </div>

                              <div className="w-px h-6 bg-gray-100"></div>

                              <select
                                value={item.status}
                                onChange={(e) =>
                                  handleOverdueStatusChange(
                                    selectedStore.id,
                                    item,
                                    e.target.value as WeeklyOverdueItem['status']
                                  )
                                }
                                className="h-8 px-2 text-xs bg-gray-50 border border-gray-200 rounded-md text-gray-700 focus:outline-none focus:bg-white"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <option value="pending">待处理</option>
                                <option value="processing">处理中</option>
                                <option value="completed">已完成</option>
                              </select>

                              <button
                                onClick={() =>
                                  openNoteModal({
                                    type: 'patient',
                                    id: item.patientId,
                                    storeId: selectedStore.id,
                                    title: item.patientName,
                                  })
                                }
                                className="p-1.5 rounded-md text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                              >
                                <StickyNote className="w-4 h-4" />
                              </button>

                              <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            <div className="grid grid-cols-3 gap-6">
              <div className="col-span-2">
                <TrendChart data={trendData} />
              </div>
              <div className="space-y-6">
                <div className="bg-white rounded-xl border border-gray-100 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-semibold text-gray-900">
                      高风险患者
                    </h3>
                    <button
                      onClick={() => navigate('/patients')}
                      className="text-xs text-blue-600 hover:text-blue-700"
                    >
                      全部 →
                    </button>
                  </div>
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
                                逾期 {patient.overdueDays} 天 · {patient.customerService}
                              </p>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openNoteModal({
                                  type: 'patient',
                                  id: patient.id,
                                  storeId: selectedStore.id,
                                  title: patient.name,
                                });
                              }}
                              className="p-1.5 rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            >
                              <StickyNote className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-400">
                      <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">暂无高风险患者</p>
                    </div>
                  )}
                </div>

                <div className="bg-white rounded-xl border border-gray-100 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-semibold text-gray-900">
                      待处理批次
                    </h3>
                    <button
                      onClick={() => navigate('/batches')}
                      className="text-xs text-blue-600 hover:text-blue-700"
                    >
                      全部 →
                    </button>
                  </div>
                  {storeBatches.filter((b) => b.status !== 'completed').length > 0 ? (
                    <div className="space-y-3">
                      {storeBatches
                        .filter((b) => b.status !== 'completed')
                        .slice(0, 4)
                        .map((batch) => {
                          const anom =
                            batchAnomalies.get(batch.id) || batch.anomaly;
                          return (
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
                                  className={cn(
                                    'text-xs font-medium',
                                    batch.warningLevel === 'danger' && 'text-red-600',
                                    batch.warningLevel === 'warning' && 'text-orange-600',
                                    batch.warningLevel === 'normal' && 'text-gray-500'
                                  )}
                                >
                                  {batch.stayDays}天
                                </span>
                              </div>
                              <p className="text-xs text-gray-500 mt-1">
                                {batch.manufacturer} · {batch.totalQuantity}件
                                {anom && (
                                  <span className="ml-2 text-amber-600">
                                    · <Flag className="w-3 h-3 inline" /> {anom.label}
                                  </span>
                                )}
                              </p>
                            </div>
                          );
                        })}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-400">
                      <Package className="w-10 h-10 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">暂无在途批次</p>
                    </div>
                  )}
                </div>
              </div>
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
                                className={cn(
                                  'text-xs font-medium',
                                  batch.warningLevel === 'danger' && 'text-red-600',
                                  batch.warningLevel === 'warning' && 'text-orange-600',
                                  batch.warningLevel === 'normal' && 'text-gray-500'
                                )}
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
            onClick={() =>
              setViewMode(viewMode === 'review' ? 'overview' : 'review')
            }
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
          <div className="flex items-center justify-between">
            <div className="grid grid-cols-4 gap-5 flex-1 mr-6">
              <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">逾期件数</p>
                  <p className="text-xl font-bold text-red-600 tabular-nums">
                    {reviewStats.overdueQty}
                  </p>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">涉及患者</p>
                  <p className="text-xl font-bold text-gray-800 tabular-nums">
                    {reviewStats.overdueCount}
                  </p>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">高风险患者</p>
                  <p className="text-xl font-bold text-orange-600 tabular-nums">
                    {reviewStats.highRiskCount}
                  </p>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                  <Flag className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">异常批次</p>
                  <p className="text-xl font-bold text-amber-600 tabular-nums">
                    {reviewStats.anomalyCount}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 p-1.5 inline-flex">
              <button
                onClick={() => setSeverityFilter('all')}
                className={cn(
                  'px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-2',
                  severityFilter === 'all'
                    ? 'bg-purple-500 text-white'
                    : 'text-gray-600 hover:bg-gray-50'
                )}
              >
                全部问题
              </button>
              <button
                onClick={() => setSeverityFilter('severe')}
                className={cn(
                  'px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-2',
                  severityFilter === 'severe'
                    ? 'bg-red-500 text-white'
                    : 'text-gray-600 hover:bg-gray-50'
                )}
              >
                仅严重
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {reviewGroups.map((group) => {
              const expanded = expandedStores[group.storeId] ?? true;
              return (
                <div
                  key={group.storeId}
                  className="bg-white rounded-xl border border-gray-100 overflow-hidden"
                >
                  <button
                    onClick={() => toggleStoreExpand(group.storeId)}
                    className={cn(
                      'w-full px-6 py-4 flex items-center gap-4 hover:bg-gray-50 transition-colors',
                      group.severeCount > 0 && 'bg-red-50/40 hover:bg-red-50/60'
                    )}
                  >
                    <ChevronRight
                      className={cn(
                        'w-5 h-5 text-gray-400 transition-transform flex-shrink-0',
                        expanded && 'rotate-90'
                      )}
                    />
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-semibold text-gray-900">
                          {group.storeName}
                        </h3>
                        {group.severeCount > 0 && (
                          <span className="px-2 py-0.5 text-[10px] bg-red-100 text-red-700 rounded font-medium">
                            {group.severeCount} 项严重
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        共 {group.totalIssues} 项问题待跟进
                      </p>
                    </div>
                    <div className="flex items-center gap-4 flex-shrink-0">
                      <div className="text-center px-3">
                        <p className="text-sm font-bold text-red-600 tabular-nums">
                          {group.overdueQty}
                        </p>
                        <p className="text-[10px] text-gray-400">逾期件</p>
                      </div>
                      <div className="text-center px-3">
                        <p className="text-sm font-bold text-orange-600 tabular-nums">
                          {group.highRiskPatients.length}
                        </p>
                        <p className="text-[10px] text-gray-400">高风险</p>
                      </div>
                      <div className="text-center px-3">
                        <p className="text-sm font-bold text-amber-600 tabular-nums">
                          {group.anomalyBatches.length}
                        </p>
                        <p className="text-[10px] text-gray-400">异常批次</p>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStoreClick(group.storeId);
                      }}
                      className="px-3 py-1.5 text-xs font-medium text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-md transition-colors flex-shrink-0"
                    >
                      进入门店 →
                    </button>
                  </button>

                  {expanded && (
                    <div className="px-6 pb-5 pt-2 space-y-4 border-t border-gray-50">
                      {group.overdueItems.length > 0 && (
                        <div>
                          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2.5 flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                            逾期未发 ({group.overdueItems.length}位，
                            {group.overdueQty}件)
                          </h4>
                          <div className="grid grid-cols-2 gap-2">
                            {group.overdueItems.map((item) => {
                              const due = new Date(item.dueDate);
                              const today = new Date('2026-06-20');
                              const daysLate = Math.floor(
                                (today.getTime() - due.getTime()) /
                                  (1000 * 60 * 60 * 24)
                              );
                              const isSevere = daysLate >= 5;
                              if (severityFilter === 'severe' && !isSevere) return null;
                              return (
                                <div
                                  key={item.id}
                                  className={cn(
                                    'p-3 rounded-lg border hover:shadow-sm transition-all',
                                    isSevere
                                      ? 'bg-red-50 border-red-100'
                                      : 'bg-gray-50 border-gray-100'
                                  )}
                                >
                                  <div className="flex items-center justify-between mb-1.5">
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm font-semibold text-gray-900">
                                        {item.patientName}
                                      </span>
                                      <span
                                        className={cn(
                                          'px-1.5 py-0.5 text-[10px] font-medium rounded border',
                                          overdueStatusMap[item.status].className
                                        )}
                                      >
                                        {overdueStatusMap[item.status].label}
                                      </span>
                                    </div>
                                    <span
                                      className={cn(
                                        'text-xs font-semibold tabular-nums',
                                        isSevere ? 'text-red-600' : 'text-gray-600'
                                      )}
                                    >
                                      {item.quantity}件 · 逾期{daysLate}天
                                    </span>
                                  </div>
                                  <p className="text-xs text-gray-500 mb-2">
                                    <User className="w-3 h-3 inline mr-1" />
                                    {item.assignee}
                                    {item.note && ` · ${item.note}`}
                                  </p>
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() =>
                                        handleItemNavigate(
                                          'patient',
                                          item.patientId,
                                          group.storeId
                                        )
                                      }
                                      className="flex-1 h-7 text-xs text-gray-600 bg-white hover:bg-gray-100 rounded border border-gray-200 transition-colors"
                                    >
                                      查看明细
                                    </button>
                                    <button
                                      onClick={() =>
                                        openNoteModal({
                                          type: 'patient',
                                          id: item.patientId,
                                          storeId: group.storeId,
                                          title: item.patientName,
                                        })
                                      }
                                      className="h-7 w-7 flex items-center justify-center text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded border border-gray-200 transition-colors"
                                    >
                                      <StickyNote className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {group.highRiskPatients.length > 0 && (
                        <div>
                          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2.5 flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5 text-orange-500" />
                            高风险患者 ({group.highRiskPatients.length}人)
                          </h4>
                          <div className="grid grid-cols-2 gap-2">
                            {group.highRiskPatients.map((p) => {
                              const isSevere = p.overdueDays >= 7;
                              if (severityFilter === 'severe' && !isSevere) return null;
                              return (
                                <div
                                  key={p.id}
                                  className={cn(
                                    'p-3 rounded-lg border hover:shadow-sm transition-all cursor-pointer',
                                    isSevere
                                      ? 'bg-orange-50 border-orange-100'
                                      : 'bg-gray-50 border-gray-100'
                                  )}
                                  onClick={() =>
                                    handleItemNavigate(
                                      'patient',
                                      p.id,
                                      group.storeId
                                    )
                                  }
                                >
                                  <div className="flex items-center justify-between mb-1.5">
                                    <div className="flex items-center gap-2">
                                      <div className="w-6 h-6 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center text-white text-[10px] font-medium">
                                        {p.name.slice(0, 1)}
                                      </div>
                                      <span className="text-sm font-semibold text-gray-900">
                                        {p.name}
                                      </span>
                                    </div>
                                    <span
                                      className={cn(
                                        'text-xs font-semibold tabular-nums',
                                        isSevere ? 'text-red-600' : 'text-orange-600'
                                      )}
                                    >
                                      逾期{p.overdueDays}天
                                    </span>
                                  </div>
                                  <p className="text-xs text-gray-500 mb-2">
                                    客服：{p.customerService} · 剩余{p.remainingAligners}副
                                  </p>
                                  <div className="flex items-center gap-2">
                                    <div className="flex-1 h-7 text-xs text-gray-600 flex items-center px-2 bg-white rounded border border-gray-200">
                                      {p.lastCommunicationResult.slice(0, 16)}...
                                    </div>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        openNoteModal({
                                          type: 'patient',
                                          id: p.id,
                                          storeId: group.storeId,
                                          title: p.name,
                                        });
                                      }}
                                      className="h-7 w-7 flex items-center justify-center text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded border border-gray-200 transition-colors"
                                    >
                                      <StickyNote className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {group.anomalyBatches.length > 0 && (
                        <div>
                          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2.5 flex items-center gap-1.5">
                            <Flag className="w-3.5 h-3.5 text-amber-500" />
                            异常批次 ({group.anomalyBatches.length}批)
                          </h4>
                          <div className="grid grid-cols-2 gap-2">
                            {group.anomalyBatches.map((batch) => {
                              const anom =
                                batchAnomalies.get(batch.id) || batch.anomaly;
                              const isSevere = batch.warningLevel === 'danger';
                              if (severityFilter === 'severe' && !isSevere) return null;
                              return (
                                <div
                                  key={batch.id}
                                  className={cn(
                                    'p-3 rounded-lg border hover:shadow-sm transition-all cursor-pointer',
                                    isSevere
                                      ? 'bg-red-50 border-red-100'
                                      : 'bg-amber-50 border-amber-100'
                                  )}
                                  onClick={() =>
                                    handleItemNavigate(
                                      'batch',
                                      batch.id,
                                      group.storeId
                                    )
                                  }
                                >
                                  <div className="flex items-center justify-between mb-1.5">
                                    <span className="text-sm font-mono font-semibold text-gray-900">
                                      {batch.batchNo}
                                    </span>
                                    <span
                                      className={cn(
                                        'text-xs font-semibold tabular-nums',
                                        isSevere ? 'text-red-600' : 'text-amber-600'
                                      )}
                                    >
                                      滞留{batch.stayDays}天
                                    </span>
                                  </div>
                                  <p className="text-xs text-gray-500 mb-2">
                                    {batch.manufacturer} · {batch.totalQuantity}件
                                    {anom && ` · ${anom.label}`}
                                  </p>
                                  <div className="flex items-center gap-2">
                                    <div className="flex-1 flex items-center gap-2 text-xs">
                                      {anom?.assignee && (
                                        <span className="text-gray-600 flex items-center gap-1">
                                          <User className="w-3 h-3" />
                                          {anom.assignee}
                                        </span>
                                      )}
                                      {anom?.deadline && (
                                        <span className="text-gray-600 flex items-center gap-1">
                                          <CalendarDays className="w-3 h-3" />
                                          {anom.deadline.slice(5)}
                                        </span>
                                      )}
                                    </div>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        openNoteModal({
                                          type: 'batch',
                                          id: batch.id,
                                          storeId: group.storeId,
                                          title: batch.batchNo,
                                        });
                                      }}
                                      className="h-7 w-7 flex items-center justify-center text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded border border-gray-200 transition-colors"
                                    >
                                      <StickyNote className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
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

      {showNoteModal && noteTarget && (
        <div
          className="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
          onClick={() => setShowNoteModal(false)}
        >
          <div
            className="bg-white rounded-xl shadow-xl p-6 w-[460px]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-base font-semibold text-gray-900">添加周会备注</h3>
                <p className="text-xs text-gray-500 mt-1">{noteTarget.title}</p>
              </div>
              <button
                onClick={() => setShowNoteModal(false)}
                className="p-1 hover:bg-gray-100 rounded-md transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">
                  备注内容 *
                </label>
                <textarea
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  placeholder="记录周会上定下的动作..."
                  rows={3}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-blue-300 focus:ring-2 focus:ring-blue-50 transition-all resize-none"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">
                  待办事项（每行一条）
                </label>
                <textarea
                  value={noteActions}
                  onChange={(e) => setNoteActions(e.target.value)}
                  placeholder="1. 协调总部支援&#10;2. 周五前完成..."
                  rows={3}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-blue-300 focus:ring-2 focus:ring-blue-50 transition-all resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">
                    负责人
                  </label>
                  <select
                    value={noteAssignee}
                    onChange={(e) => setNoteAssignee(e.target.value)}
                    className="w-full h-9 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:bg-white focus:border-blue-300 focus:ring-2 focus:ring-blue-50 transition-all"
                  >
                    <option value="">请选择</option>
                    {assignees.map((a) => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">
                    截止日期
                  </label>
                  <input
                    type="date"
                    value={noteDueDate}
                    onChange={(e) => setNoteDueDate(e.target.value)}
                    className="w-full h-9 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:bg-white focus:border-blue-300 focus:ring-2 focus:ring-blue-50 transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setShowNoteModal(false)}
                className="flex-1 h-9 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSaveNote}
                disabled={!noteContent.trim()}
                className="flex-1 h-9 text-sm text-white bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center justify-center gap-1"
              >
                <Plus className="w-4 h-4" />
                添加备注
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
