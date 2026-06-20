export interface Store {
  id: string;
  name: string;
  city: string;
  weeklyShouldSend: number;
  weeklySent: number;
  weeklyOverdue: number;
  weeklyEarly: number;
  completionRate: number;
  trend: 'up' | 'down' | 'flat';
  trendValue: number;
  overdueItems?: WeeklyOverdueItem[];
}

export interface WeeklyOverdueItem {
  id: string;
  patientName: string;
  patientId: string;
  quantity: number;
  dueDate: string;
  assignee: string;
  status: 'pending' | 'processing' | 'completed';
  note?: string;
}

export interface Patient {
  id: string;
  name: string;
  avatar: string;
  storeId: string;
  storeName: string;
  doctor: string;
  customerService: string;
  overdueDays: number;
  missedVisits: number;
  remainingAligners: number;
  riskLevel: 'low' | 'medium' | 'high';
  lastCommunication: string;
  lastCommunicationResult: string;
  treatmentStage: string;
  totalAligners: number;
  currentAligner: number;
  startDate: string;
  phone: string;
  communicationHistory: CommunicationRecord[];
}

export interface CommunicationRecord {
  date: string;
  content: string;
  result: string;
  operator: string;
}

export interface Batch {
  id: string;
  batchNo: string;
  storeId: string;
  storeName: string;
  manufacturer: string;
  arrivalDate: string;
  totalQuantity: number;
  status: 'arrived' | 'distributing' | 'shelved' | 'delivering' | 'completed';
  distributedCount: number;
  shelvedCount: number;
  deliveredCount: number;
  stayDays: number;
  warningLevel: 'normal' | 'warning' | 'danger';
  stages: BatchStage[];
  anomaly?: BatchAnomaly;
}

export type AnomalyStatus = 'pending' | 'assigned' | 'processing' | 'closed';

export interface BatchAnomaly {
  type: 'stuck_distributing' | 'stuck_shelving' | 'stuck_notifying' | 'patient_not_picked_up' | '';
  label: string;
  reportedAt: string;
  reportedBy: string;
  assignee?: string;
  deadline?: string;
  status: AnomalyStatus;
  statusHistory?: AnomalyStatusHistory[];
}

export interface AnomalyStatusHistory {
  status: AnomalyStatus;
  updatedAt: string;
  updatedBy: string;
  remark?: string;
}

export interface BatchStage {
  name: string;
  status: 'completed' | 'in-progress' | 'pending';
  date?: string;
  duration?: number;
}

export type TabKey = 'overview' | 'patients' | 'batches';

export interface TrendData {
  week: string;
  shouldSend: number;
  sent: number;
  overdue: number;
}

export interface MeetingNote {
  id: string;
  storeId: string;
  targetType: 'patient' | 'batch' | 'store';
  targetId: string;
  content: string;
  actionItems: string[];
  assignees: string[];
  dueDate?: string;
  createdAt: string;
  createdBy: string;
  status: 'open' | 'in_progress' | 'closed';
}
