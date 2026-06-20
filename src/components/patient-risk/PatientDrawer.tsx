import { Patient } from '@/types';
import {
  X,
  Phone,
  MessageCircle,
  User,
  MapPin,
  Calendar,
  Clock,
  AlertTriangle,
  MessageSquare,
  ChevronRight,
  StickyNote,
  Plus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { useStore } from '@/store/useStore';

interface PatientDrawerProps {
  patient: Patient | null;
  onClose: () => void;
}

const assignees = [
  '北京客服-李明',
  '广州客服-林芳',
  '广州客服-黄丽',
  '杭州客服-陈雅',
  '杭州客服-钱敏',
  '武汉客服-冯洁',
  '武汉客服-曹颖',
  '上海客服-赵敏',
  '上海客服-周文',
  '门店店长',
  '主治医生',
];

export default function PatientDrawer({ patient, onClose }: PatientDrawerProps) {
  const { addMeetingNote, meetingNotes } = useStore();
  const [showNotePanel, setShowNotePanel] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const [noteActions, setNoteActions] = useState('');
  const [noteAssignee, setNoteAssignee] = useState('');
  const [noteDueDate, setNoteDueDate] = useState('');

  if (!patient) return null;

  const patientNotes = meetingNotes.filter(
    (n) => n.targetType === 'patient' && n.targetId === patient.id
  );
  const storeNotes = meetingNotes.filter(
    (n) => n.storeId === patient.storeId && n.targetType === 'store'
  );

  const getRiskLabel = (level: string) => {
    switch (level) {
      case 'high':
        return { text: '高风险', className: 'bg-red-50 text-red-600 border-red-200' };
      case 'medium':
        return { text: '中风险', className: 'bg-orange-50 text-orange-600 border-orange-200' };
      default:
        return { text: '低风险', className: 'bg-green-50 text-green-600 border-green-200' };
    }
  };

  const handleAddNote = () => {
    if (!noteContent.trim()) return;
    addMeetingNote({
      storeId: patient.storeId,
      targetType: 'patient',
      targetId: patient.id,
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
    setShowNotePanel(false);
  };

  const risk = getRiskLabel(patient.riskLevel);

  return (
    <div className="fixed inset-0 z-50 flex">
      <div
        className="flex-1 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      ></div>

      <div className="w-[480px] bg-white shadow-2xl flex flex-col animate-slide-in">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="text-base font-semibold text-gray-900">患者详情</h3>
            <button
              onClick={() => setShowNotePanel(!showNotePanel)}
              className={cn(
                'flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md border transition-colors',
                showNotePanel
                  ? 'bg-blue-50 text-blue-600 border-blue-200'
                  : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
              )}
            >
              <StickyNote className="w-3.5 h-3.5" />
              周会备注
              {patientNotes.length > 0 && (
                <span className="w-4 h-4 bg-blue-500 text-white rounded-full text-[10px] flex items-center justify-center">
                  {patientNotes.length}
                </span>
              )}
            </button>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {showNotePanel && (
            <div className="p-6 border-b border-gray-50 bg-gradient-to-b from-blue-50/30 to-white space-y-3">
              {patientNotes.length > 0 && (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {patientNotes.map((n) => (
                    <div
                      key={n.id}
                      className="p-3 bg-white rounded-lg border border-blue-100 text-xs"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-blue-600 font-medium">{n.createdBy}</span>
                        <span className="text-gray-400">{n.createdAt}</span>
                      </div>
                      <p className="text-gray-700 text-sm">{n.content}</p>
                      {n.actionItems.length > 0 && (
                        <ul className="mt-2 space-y-1">
                          {n.actionItems.map((ai, i) => (
                            <li key={i} className="flex items-start gap-1 text-gray-600">
                              <span className="text-blue-500 mt-0.5">•</span>
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
              {storeNotes.length > 0 && (
                <div className="p-3 bg-amber-50/50 rounded-lg border border-amber-100 text-xs">
                  <div className="flex items-center gap-1.5 text-amber-700 font-medium mb-1.5">
                    <StickyNote className="w-3.5 h-3.5" />
                    门店级备注（{patient.storeName}）
                  </div>
                  {storeNotes.map((n) => (
                    <div key={n.id} className="mt-1">
                      <p className="text-gray-700">{n.content}</p>
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-2">
                <p className="text-xs font-semibold text-gray-700 mb-2">添加新备注</p>
                <div className="space-y-2.5">
                  <textarea
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    placeholder="记录周会上定下的动作..."
                    rows={2}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-50 transition-all resize-none"
                  />
                  <textarea
                    value={noteActions}
                    onChange={(e) => setNoteActions(e.target.value)}
                    placeholder="待办事项（每行一条，可选）"
                    rows={2}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-50 transition-all resize-none"
                  />
                  <div className="grid grid-cols-2 gap-2.5">
                    <select
                      value={noteAssignee}
                      onChange={(e) => setNoteAssignee(e.target.value)}
                      className="h-9 px-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-50 transition-all"
                    >
                      <option value="">选择负责人（可选）</option>
                      {assignees.map((a) => (
                        <option key={a} value={a}>{a}</option>
                      ))}
                    </select>
                    <input
                      type="date"
                      value={noteDueDate}
                      onChange={(e) => setNoteDueDate(e.target.value)}
                      className="h-9 px-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-50 transition-all"
                    />
                  </div>
                  <button
                    onClick={handleAddNote}
                    disabled={!noteContent.trim()}
                    className="w-full h-9 text-sm text-white bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    添加周会备注
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="p-6 border-b border-gray-50 bg-gradient-to-b from-blue-50/50 to-white">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center">
                <User className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-gray-900">
                    {patient.name}
                  </h2>
                  <span
                    className={cn(
                      'px-2.5 py-0.5 text-xs font-medium rounded-md border',
                      risk.className
                    )}
                  >
                    {risk.text}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                  <MapPin className="w-4 h-4" />
                  <span>{patient.storeName}</span>
                </div>
                <div className="flex items-center gap-3 mt-3">
                  <button className="flex items-center gap-1.5 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors">
                    <Phone className="w-4 h-4" />
                    电话联系
                  </button>
                  <button className="flex items-center gap-1.5 px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded-lg transition-colors">
                    <MessageCircle className="w-4 h-4" />
                    发送消息
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-4">
                风险指标
              </h4>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-red-50 rounded-xl p-4 text-center">
                  <p
                    className={cn(
                      'text-2xl font-bold tabular-nums',
                      patient.overdueDays >= 7
                        ? 'text-red-600'
                        : 'text-orange-600'
                    )}
                  >
                    {patient.overdueDays}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">逾期天数</p>
                </div>
                <div className="bg-orange-50 rounded-xl p-4 text-center">
                  <p
                    className={cn(
                      'text-2xl font-bold tabular-nums',
                      patient.missedVisits >= 2
                        ? 'text-red-600'
                        : 'text-orange-600'
                    )}
                  >
                    {patient.missedVisits}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">缺诊次数</p>
                </div>
                <div className="bg-yellow-50 rounded-xl p-4 text-center">
                  <p
                    className={cn(
                      'text-2xl font-bold tabular-nums',
                      patient.remainingAligners <= 2
                        ? 'text-red-600'
                        : 'text-orange-600'
                    )}
                  >
                    {patient.remainingAligners}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">剩余牙套</p>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-4">
                基本信息
              </h4>
              <div className="bg-gray-50 rounded-xl divide-y divide-gray-100">
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm text-gray-500">治疗阶段</span>
                  <span className="text-sm font-medium text-gray-700">
                    {patient.treatmentStage}
                  </span>
                </div>
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm text-gray-500">主治医生</span>
                  <span className="text-sm font-medium text-gray-700">
                    {patient.doctor}
                  </span>
                </div>
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm text-gray-500">跟进客服</span>
                  <span className="text-sm font-medium text-gray-700">
                    {patient.customerService}
                  </span>
                </div>
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm text-gray-500">开始治疗</span>
                  <span className="text-sm font-medium text-gray-700">
                    {patient.startDate}
                  </span>
                </div>
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm text-gray-500">联系电话</span>
                  <span className="text-sm font-medium text-gray-700">
                    {patient.phone}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-4">
                治疗进度
              </h4>
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-gray-600">
                    当前第 {patient.currentAligner} 副
                  </span>
                  <span className="text-sm font-medium text-gray-700 tabular-nums">
                    {Math.round(
                      (patient.currentAligner / patient.totalAligners) * 100
                    )}
                    %
                  </span>
                </div>
                <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full transition-all duration-500"
                    style={{
                      width: `${(patient.currentAligner / patient.totalAligners) * 100}%`,
                    }}
                  ></div>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-gray-400">第1副</span>
                  <span className="text-xs text-gray-400">
                    共 {patient.totalAligners} 副
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-4">
                沟通记录
              </h4>
              <div className="space-y-3">
                {patient.communicationHistory.map((record, index) => (
                  <div
                    key={index}
                    className="bg-gray-50 rounded-xl p-4 relative pl-8"
                  >
                    <div className="absolute left-4 top-5 w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {record.date}
                      </span>
                      <span className="text-xs text-gray-400">
                        {record.operator}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-gray-700">
                      {record.content}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      {record.result}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex items-center gap-3">
          <button className="flex-1 h-11 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-xl transition-colors flex items-center justify-center gap-2">
            <Phone className="w-4 h-4" />
            立即联系患者
          </button>
          <button
            onClick={() => setShowNotePanel(true)}
            className="flex-1 h-11 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-xl transition-colors flex items-center justify-center gap-1.5"
          >
            <StickyNote className="w-4 h-4" />
            添加周会备注
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
