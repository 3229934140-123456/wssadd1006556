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
  Activity,
  MessageSquare,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PatientDrawerProps {
  patient: Patient | null;
  onClose: () => void;
}

export default function PatientDrawer({ patient, onClose }: PatientDrawerProps) {
  if (!patient) return null;

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

  const risk = getRiskLabel(patient.riskLevel);

  return (
    <div className="fixed inset-0 z-50 flex">
      <div
        className="flex-1 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      ></div>

      <div className="w-[480px] bg-white shadow-2xl flex flex-col animate-slide-in">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-900">患者详情</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
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
          <button className="flex-1 h-11 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-xl transition-colors">
            添加跟进记录
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
