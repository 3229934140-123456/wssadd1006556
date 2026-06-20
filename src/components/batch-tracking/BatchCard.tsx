import { useState, useEffect } from 'react';
import { Batch, BatchAnomaly, AnomalyStatus } from '@/types';
import {
  Package,
  Clock,
  MapPin,
  CheckCircle2,
  Circle,
  Loader2,
  AlertTriangle,
  Box,
  Archive,
  Send,
  Flag,
  X,
  User,
  CalendarDays,
  Plus,
  ChevronDown,
  StickyNote,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStore } from '@/store/useStore';
import { batches as storeBatches } from '@/data/batches';

interface BatchCardProps {
  batch: Batch;
  onClick?: () => void;
}

const statusMap: Record<string, { label: string; className: string }> = {
  arrived: { label: '已到货', className: 'bg-gray-100 text-gray-600' },
  distributing: { label: '分盒中', className: 'bg-blue-100 text-blue-600' },
  shelved: { label: '已入柜', className: 'bg-purple-100 text-purple-600' },
  delivering: { label: '发放中', className: 'bg-green-100 text-green-600' },
  completed: { label: '已完成', className: 'bg-green-100 text-green-600' },
};

const anomalyStatusMap: Record<AnomalyStatus, { label: string; className: string }> = {
  pending: { label: '待分派', className: 'bg-gray-100 text-gray-600 border-gray-200' },
  assigned: { label: '已分派', className: 'bg-blue-50 text-blue-600 border-blue-200' },
  processing: { label: '处理中', className: 'bg-amber-50 text-amber-600 border-amber-200' },
  closed: { label: '已关闭', className: 'bg-green-50 text-green-600 border-green-200' },
};

const stageConfig = [
  { key: 'distributed', label: '已分盒', icon: Box, color: 'blue' },
  { key: 'shelved', label: '已入柜', icon: Archive, color: 'purple' },
  { key: 'delivered', label: '已发放', icon: Send, color: 'green' },
];

const anomalyTypes = [
  { type: 'stuck_distributing' as const, label: '分盒卡顿', desc: '分盒处理卡住，无法继续拆分' },
  { type: 'stuck_shelving' as const, label: '入柜延迟', desc: '已分盒但无法入柜登记' },
  { type: 'stuck_notifying' as const, label: '通知未达', desc: '已入柜但无法通知到患者' },
  { type: 'patient_not_picked_up' as const, label: '患者未取走', desc: '已通知但患者未到店取走' },
];

const assignees = [
  '李督导',
  '王总部',
  '广州客服-林芳',
  '广州客服-黄丽',
  '杭州客服-陈雅',
  '杭州客服-钱敏',
  '武汉客服-冯洁',
  '武汉客服-曹颖',
  '门店店长',
];

export default function BatchCard({ batch, onClick }: BatchCardProps) {
  const {
    batchAnomalies,
    setBatchAnomaly,
    updateBatchAnomaly,
    getStoreNotes,
    addMeetingNote,
  } = useStore();

  const [showAnomalyModal, setShowAnomalyModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const [noteActions, setNoteActions] = useState('');
  const [noteAssignee, setNoteAssignee] = useState('');
  const [noteDueDate, setNoteDueDate] = useState('');
  const [editingAnomaly, setEditingAnomaly] = useState<{
    assignee: string;
    deadline: string;
    status: AnomalyStatus;
    remark: string;
  } | null>(null);

  const status = statusMap[batch.status];
  const anomaly = batchAnomalies.get(batch.id) || batch.anomaly;

  useEffect(() => {
    if (anomaly && !batchAnomalies.has(batch.id) && anomaly.type) {
      setBatchAnomaly(batch.id, anomaly);
    }
  }, []);

  const currentAnomaly = batchAnomalies.get(batch.id);
  const storeNotes = getStoreNotes(batch.storeId).filter(
    (n) => n.targetType === 'batch' && n.targetId === batch.id
  );

  const getStageCount = (key: string) => {
    switch (key) {
      case 'distributed':
        return batch.distributedCount;
      case 'shelved':
        return batch.shelvedCount;
      case 'delivered':
        return batch.deliveredCount;
      default:
        return 0;
    }
  };

  const getStageStatus = (index: number) => {
    const currentStage =
      batch.status === 'completed'
        ? 3
        : batch.status === 'delivering'
        ? 2
        : batch.status === 'shelved'
        ? 1
        : batch.status === 'distributing'
        ? 0
        : -1;
    if (index < currentStage || batch.status === 'completed') return 'completed';
    if (index === currentStage) return 'in-progress';
    return 'pending';
  };

  const handleAnomalySelect = (type: typeof anomalyTypes[number]) => {
    const newAnomaly: BatchAnomaly = {
      type: type.type,
      label: type.label,
      reportedAt: new Date().toISOString().split('T')[0],
      reportedBy: batch.storeName,
      status: 'pending',
      statusHistory: [
        {
          status: 'pending',
          updatedAt: new Date().toISOString().split('T')[0],
          updatedBy: batch.storeName,
        },
      ],
    };
    setBatchAnomaly(batch.id, newAnomaly);
    setShowAnomalyModal(false);
  };

  const handleClearAnomaly = () => {
    setBatchAnomaly(batch.id, null);
    setShowAnomalyModal(false);
  };

  const handleSaveAnomaly = () => {
    if (!editingAnomaly || !currentAnomaly) return;
    const historyEntry = {
      status: editingAnomaly.status,
      updatedAt: new Date().toISOString().split('T')[0],
      updatedBy: '总部督导',
      remark: editingAnomaly.remark,
    };
    updateBatchAnomaly(batch.id, {
      assignee: editingAnomaly.assignee || undefined,
      deadline: editingAnomaly.deadline || undefined,
      status: editingAnomaly.status,
      historyEntry,
    });
    setEditingAnomaly(null);
  };

  const openAnomalyEditor = () => {
    if (!currentAnomaly) return;
    setEditingAnomaly({
      assignee: currentAnomaly.assignee || '',
      deadline: currentAnomaly.deadline || '',
      status: currentAnomaly.status || 'pending',
      remark: '',
    });
    setShowAnomalyModal(true);
  };

  const handleAddNote = () => {
    if (!noteContent.trim()) return;
    addMeetingNote({
      storeId: batch.storeId,
      targetType: 'batch',
      targetId: batch.id,
      content: noteContent,
      actionItems: noteActions.split('\n').filter(Boolean),
      assignees: noteAssignee ? [noteAssignee] : [],
      dueDate: noteDueDate || undefined,
      createdBy: '周会',
      status: 'open',
    });
    setNoteContent('');
    setNoteActions('');
    setNoteAssignee('');
    setNoteDueDate('');
    setShowNoteModal(false);
  };

  return (
    <>
      <div
        onClick={onClick}
        className={cn(
          'bg-white rounded-xl border border-gray-100 p-5 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 cursor-pointer relative overflow-hidden',
          batch.warningLevel === 'danger' && 'border-red-200',
          batch.warningLevel === 'warning' && 'border-orange-200',
          currentAnomaly && 'border-amber-300 bg-amber-50/20'
        )}
      >
        {batch.warningLevel === 'danger' && (
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-red-500/10 to-transparent -rotate-45 -mr-10 -mt-10"></div>
        )}

        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-sm font-bold text-gray-900 font-mono tracking-wide">
                {batch.batchNo}
              </h4>
              <span className={cn('px-2 py-0.5 text-xs font-medium rounded-md', status.className)}>
                {status.label}
              </span>
              {currentAnomaly && (
                <>
                  <span className="px-2 py-0.5 text-xs font-medium rounded-md bg-amber-100 text-amber-700 border border-amber-200 flex items-center gap-1">
                    <Flag className="w-3 h-3" />
                    {currentAnomaly.label}
                  </span>
                  <span
                    className={cn(
                      'px-2 py-0.5 text-xs font-medium rounded-md border',
                      anomalyStatusMap[currentAnomaly.status].className
                    )}
                  >
                    {anomalyStatusMap[currentAnomaly.status].label}
                  </span>
                </>
              )}
            </div>
            <div className="flex items-center gap-3 mt-2">
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <MapPin className="w-3 h-3" />
                {batch.storeName}
              </span>
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <Package className="w-3 h-3" />
                {batch.manufacturer}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {batch.status !== 'completed' && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowNoteModal(true);
                  }}
                  className="p-1.5 rounded-lg bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                  title="添加周会备注"
                >
                  <StickyNote className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (currentAnomaly) {
                      openAnomalyEditor();
                    } else {
                      setShowAnomalyModal(true);
                    }
                  }}
                  className={cn(
                    'p-1.5 rounded-lg transition-colors',
                    currentAnomaly
                      ? 'bg-amber-100 text-amber-600 hover:bg-amber-200'
                      : 'bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-600'
                  )}
                  title={currentAnomaly ? '异常管理' : '标记异常'}
                >
                  <Flag className="w-4 h-4" />
                </button>
              </>
            )}
            {batch.warningLevel !== 'normal' && (
              <div
                className={cn(
                  'flex items-center gap-1 px-2.5 py-1 rounded-full',
                  batch.warningLevel === 'danger' && 'bg-red-50 text-red-600',
                  batch.warningLevel === 'warning' && 'bg-orange-50 text-orange-600'
                )}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">滞留 {batch.stayDays} 天</span>
              </div>
            )}
          </div>
        </div>

        {currentAnomaly && (
          <div
            onClick={(e) => {
              e.stopPropagation();
              openAnomalyEditor();
            }}
            className="mb-4 p-3 rounded-lg border cursor-pointer hover:shadow-sm transition-all"
            style={{
              backgroundColor:
                currentAnomaly.status === 'closed' ? 'rgba(34,197,94,0.05)' : 'rgba(251,191,36,0.08)',
              borderColor:
                currentAnomaly.status === 'closed' ? 'rgba(34,197,94,0.2)' : 'rgba(251,191,36,0.3)',
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Flag
                  className={cn(
                    'w-4 h-4',
                    currentAnomaly.status === 'closed' ? 'text-green-500' : 'text-amber-500'
                  )}
                />
                <span className="text-sm font-semibold text-gray-900">
                  {currentAnomaly.label}
                </span>
                <span
                  className={cn(
                    'px-1.5 py-0.5 text-[10px] font-medium rounded border',
                    anomalyStatusMap[currentAnomaly.status].className
                  )}
                >
                  {anomalyStatusMap[currentAnomaly.status].label}
                </span>
              </div>
              <span className="text-xs text-gray-500">
                {currentAnomaly.reportedAt}
              </span>
            </div>
            <div className="flex items-center gap-4 flex-wrap text-xs text-gray-600">
              {currentAnomaly.assignee && (
                <div className="flex items-center gap-1">
                  <User className="w-3 h-3 text-gray-400" />
                  <span>{currentAnomaly.assignee}</span>
                </div>
              )}
              {currentAnomaly.deadline && (
                <div className="flex items-center gap-1">
                  <CalendarDays className="w-3 h-3 text-gray-400" />
                  <span>截止 {currentAnomaly.deadline}</span>
                </div>
              )}
              {currentAnomaly.statusHistory && currentAnomaly.statusHistory.length > 1 && (
                <div className="text-gray-400">
                  {currentAnomaly.statusHistory.length} 条状态更新
                </div>
              )}
            </div>
          </div>
        )}

        {storeNotes.length > 0 && (
          <div
            onClick={(e) => {
              e.stopPropagation();
              setShowNoteModal(true);
            }}
            className="mb-4 p-3 bg-blue-50/50 rounded-lg border border-blue-100 cursor-pointer hover:bg-blue-50 transition-colors"
          >
            <div className="flex items-center gap-2 mb-1">
              <StickyNote className="w-3.5 h-3.5 text-blue-500" />
              <span className="text-xs font-medium text-blue-700">
                周会备注 ({storeNotes.length})
              </span>
            </div>
            <p className="text-xs text-gray-600 line-clamp-1">
              {storeNotes[0].content}
            </p>
          </div>
        )}

        <div className="space-y-3">
          {stageConfig.map((stage, index) => {
            const StageIcon = stage.icon;
            const count = getStageCount(stage.key);
            const stageStatus = getStageStatus(index);
            const percentage = Math.round((count / batch.totalQuantity) * 100);
            return (
              <div key={stage.key}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        'w-7 h-7 rounded-lg flex items-center justify-center',
                        stageStatus === 'completed' && 'bg-green-100 text-green-600',
                        stageStatus === 'in-progress' && 'bg-blue-100 text-blue-600',
                        stageStatus === 'pending' && 'bg-gray-100 text-gray-400'
                      )}
                    >
                      <StageIcon className="w-4 h-4" />
                    </div>
                    <span
                      className={cn(
                        'text-sm font-medium',
                        stageStatus === 'completed' && 'text-gray-700',
                        stageStatus === 'in-progress' && 'text-blue-600',
                        stageStatus === 'pending' && 'text-gray-400'
                      )}
                    >
                      {stage.label}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span
                      className={cn(
                        'text-base font-bold tabular-nums',
                        stageStatus === 'completed' && 'text-gray-700',
                        stageStatus === 'in-progress' && 'text-blue-600',
                        stageStatus === 'pending' && 'text-gray-300'
                      )}
                    >
                      {count}
                    </span>
                    <span className="text-xs text-gray-400">/ {batch.totalQuantity} 件</span>
                  </div>
                </div>
                <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all duration-500',
                      stage.color === 'blue' &&
                        (stageStatus === 'pending' ? 'bg-gray-200' : 'bg-blue-500'),
                      stage.color === 'purple' &&
                        (stageStatus === 'pending' ? 'bg-gray-200' : 'bg-purple-500'),
                      stage.color === 'green' &&
                        (stageStatus === 'pending' ? 'bg-gray-200' : 'bg-green-500')
                    )}
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 pt-3 border-t border-gray-50">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-gray-500">
              <Clock className="w-3.5 h-3.5" />
              <span>到货：{batch.arrivalDate}</span>
            </div>
            {batch.stayDays > 0 && batch.status !== 'completed' && (
              <span
                className={cn(
                  'font-medium tabular-nums',
                  batch.warningLevel === 'danger' && 'text-red-600',
                  batch.warningLevel === 'warning' && 'text-orange-600',
                  batch.warningLevel === 'normal' && 'text-gray-500'
                )}
              >
                滞留 {batch.stayDays} 天
              </span>
            )}
          </div>
        </div>
      </div>

      {showAnomalyModal && (
        <div
          className="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
          onClick={() => {
            setShowAnomalyModal(false);
            setEditingAnomaly(null);
          }}
        >
          <div
            className="bg-white rounded-xl shadow-xl p-6 w-[460px] max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-base font-semibold text-gray-900">
                  {editingAnomaly ? '异常闭环管理' : '标记异常原因'}
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  {batch.batchNo} · {batch.storeName}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowAnomalyModal(false);
                  setEditingAnomaly(null);
                }}
                className="p-1 hover:bg-gray-100 rounded-md transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {editingAnomaly ? (
              <div className="space-y-4">
                {currentAnomaly && (
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="flex items-center gap-2 mb-1">
                      <Flag className="w-4 h-4 text-amber-500" />
                      <span className="text-sm font-semibold">
                        {currentAnomaly.label}
                      </span>
                      <span
                        className={cn(
                          'px-1.5 py-0.5 text-[10px] font-medium rounded border',
                          anomalyStatusMap[currentAnomaly.status].className
                        )}
                      >
                        {anomalyStatusMap[currentAnomaly.status].label}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      {currentAnomaly.reportedBy} · {currentAnomaly.reportedAt}
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">
                    分派负责人
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <select
                      value={editingAnomaly.assignee}
                      onChange={(e) =>
                        setEditingAnomaly({ ...editingAnomaly, assignee: e.target.value })
                      }
                      className="w-full h-9 pl-9 pr-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:bg-white focus:border-blue-300 focus:ring-2 focus:ring-blue-50 transition-all"
                    >
                      <option value="">请选择负责人</option>
                      {assignees.map((a) => (
                        <option key={a} value={a}>
                          {a}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">
                    处理时限
                  </label>
                  <div className="relative">
                    <CalendarDays className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="date"
                      value={editingAnomaly.deadline}
                      onChange={(e) =>
                        setEditingAnomaly({ ...editingAnomaly, deadline: e.target.value })
                      }
                      className="w-full h-9 pl-9 pr-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:bg-white focus:border-blue-300 focus:ring-2 focus:ring-blue-50 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">
                    当前状态
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {(['pending', 'assigned', 'processing', 'closed'] as AnomalyStatus[]).map(
                      (s) => (
                        <button
                          key={s}
                          onClick={() => setEditingAnomaly({ ...editingAnomaly, status: s })}
                          className={cn(
                            'py-1.5 text-xs font-medium rounded-md border transition-all',
                            editingAnomaly.status === s
                              ? anomalyStatusMap[s].className + ' ring-2 ring-offset-1'
                              : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                          )}
                        >
                          {anomalyStatusMap[s].label}
                        </button>
                      )
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">
                    状态变更备注
                  </label>
                  <textarea
                    value={editingAnomaly.remark}
                    onChange={(e) =>
                      setEditingAnomaly({ ...editingAnomaly, remark: e.target.value })
                    }
                    placeholder="请输入本次状态变更的说明..."
                    rows={3}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-blue-300 focus:ring-2 focus:ring-blue-50 transition-all resize-none"
                  />
                </div>

                {currentAnomaly?.statusHistory && currentAnomaly.statusHistory.length > 0 && (
                  <div>
                    <label className="block text-xs text-gray-500 mb-2">
                      状态流转记录
                    </label>
                    <div className="space-y-2">
                      {currentAnomaly.statusHistory.map((h, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-2 p-2 bg-gray-50 rounded-lg text-xs"
                        >
                          <span
                            className={cn(
                              'px-1.5 py-0.5 rounded border flex-shrink-0',
                              anomalyStatusMap[h.status].className
                            )}
                          >
                            {anomalyStatusMap[h.status].label}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-gray-600">{h.remark}</p>
                            <p className="text-gray-400 mt-0.5">
                              {h.updatedBy} · {h.updatedAt}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  {currentAnomaly && (
                    <button
                      onClick={handleClearAnomaly}
                      className="flex-1 h-9 text-sm text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                    >
                      解除标记
                    </button>
                  )}
                  <button
                    onClick={handleSaveAnomaly}
                    className="flex-1 h-9 text-sm text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors"
                  >
                    保存变更
                  </button>
                </div>
              </div>
            ) : (
              <div>
                {currentAnomaly && (
                  <div className="mb-4 p-3 bg-amber-50 rounded-lg border border-amber-100">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-amber-700">
                        当前标记：<strong>{currentAnomaly.label}</strong>
                      </span>
                      <button
                        onClick={handleClearAnomaly}
                        className="text-xs text-amber-600 hover:text-amber-800 underline"
                      >
                        清除标记
                      </button>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  {anomalyTypes.map((type) => (
                    <button
                      key={type.type}
                      onClick={() => handleAnomalySelect(type)}
                      className={cn(
                        'w-full p-4 rounded-lg border text-left transition-all hover:shadow-sm',
                        currentAnomaly?.type === type.type
                          ? 'border-amber-300 bg-amber-50'
                          : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            'w-10 h-10 rounded-lg flex items-center justify-center',
                            currentAnomaly?.type === type.type
                              ? 'bg-amber-200 text-amber-700'
                              : 'bg-gray-100 text-gray-500'
                          )}
                        >
                          <Flag className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{type.label}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{type.desc}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {showNoteModal && (
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
                <h3 className="text-base font-semibold text-gray-900">周会备注</h3>
                <p className="text-xs text-gray-500 mt-1">
                  {batch.batchNo} · {batch.storeName}
                </p>
              </div>
              <button
                onClick={() => setShowNoteModal(false)}
                className="p-1 hover:bg-gray-100 rounded-md transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {storeNotes.length > 0 && (
              <div className="mb-4 space-y-2 max-h-40 overflow-y-auto">
                {storeNotes.map((n) => (
                  <div
                    key={n.id}
                    className="p-3 bg-blue-50/60 rounded-lg border border-blue-100 text-xs"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-blue-600 font-medium">{n.createdBy}</span>
                      <span className="text-gray-400">{n.createdAt}</span>
                    </div>
                    <p className="text-gray-700">{n.content}</p>
                    {n.actionItems.length > 0 && (
                      <ul className="mt-2 space-y-1">
                        {n.actionItems.map((ai, i) => (
                          <li key={i} className="flex items-start gap-1 text-gray-600">
                            <span className="text-blue-500">•</span>
                            {ai}
                          </li>
                        ))}
                      </ul>
                    )}
                    {(n.assignees.length > 0 || n.dueDate) && (
                      <div className="mt-2 flex items-center gap-3 text-gray-500">
                        {n.assignees.length > 0 && <span>负责人：{n.assignees.join('、')}</span>}
                        {n.dueDate && <span>截止：{n.dueDate}</span>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">
                  备注内容 *
                </label>
                <textarea
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  placeholder="记录本次周会定下的动作..."
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
                  placeholder={'1. 协调总部支援\n2. 周五前完成分盒\n3. ...'}
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
                onClick={handleAddNote}
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
    </>
  );
}
