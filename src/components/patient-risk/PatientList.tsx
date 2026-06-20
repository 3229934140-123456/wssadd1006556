import { Patient } from '@/types';
import { Phone, MessageCircle, User, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PatientListProps {
  patients: Patient[];
  onPatientClick: (patient: Patient) => void;
}

export default function PatientList({ patients, onPatientClick }: PatientListProps) {
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

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-gray-900">患者列表</h3>
          <p className="text-sm text-gray-500 mt-0.5">共 {patients.length} 位患者</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-md transition-colors">
            按逾期天数
          </button>
          <button className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-md transition-colors">
            按风险等级
          </button>
        </div>
      </div>

      <div className="divide-y divide-gray-50">
        {patients.map((patient) => {
          const risk = getRiskLabel(patient.riskLevel);

          return (
            <div
              key={patient.id}
              onClick={() => onPatientClick(patient)}
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
                      patient.riskLevel === 'high' && 'bg-red-500 animate-pulse',
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
                        risk.className
                      )}
                    >
                      {risk.text}
                    </span>
                    <span className="text-xs text-gray-400">
                      {patient.storeName}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-1.5">
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
                        patient.overdueDays >= 7
                          ? 'text-red-600'
                          : patient.overdueDays >= 3
                          ? 'text-orange-600'
                          : 'text-gray-700'
                      )}
                    >
                      {patient.overdueDays}
                    </p>
                    <p className="text-xs text-gray-400">逾期天数</p>
                  </div>

                  <div className="text-center">
                    <p
                      className={cn(
                        'text-lg font-bold tabular-nums',
                        patient.missedVisits >= 2
                          ? 'text-red-600'
                          : patient.missedVisits >= 1
                          ? 'text-orange-600'
                          : 'text-gray-700'
                      )}
                    >
                      {patient.missedVisits}
                    </p>
                    <p className="text-xs text-gray-400">缺诊次数</p>
                  </div>

                  <div className="text-center">
                    <p
                      className={cn(
                        'text-lg font-bold tabular-nums',
                        patient.remainingAligners <= 2
                          ? 'text-red-600'
                          : patient.remainingAligners <= 5
                          ? 'text-orange-600'
                          : 'text-gray-700'
                      )}
                    >
                      {patient.remainingAligners}
                    </p>
                    <p className="text-xs text-gray-400">剩余牙套</p>
                  </div>

                  <div className="w-40">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-400">治疗进度</span>
                      <span className="text-xs text-gray-600 tabular-nums">
                        {patient.currentAligner}/{patient.totalAligners}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full"
                        style={{
                          width: `${(patient.currentAligner / patient.totalAligners) * 100}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                    className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-blue-600 transition-colors"
                    title="电话联系"
                  >
                    <Phone className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                    className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-green-600 transition-colors"
                    title="发送消息"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </button>
                </div>

                <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-gray-500 transition-colors" />
              </div>

              <div className="mt-3 pl-16">
                <div className="bg-gray-50 rounded-lg px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">最近沟通</span>
                    <span className="text-xs text-gray-400">
                      {patient.lastCommunication}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-0.5 line-clamp-1">
                    {patient.lastCommunicationResult}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
