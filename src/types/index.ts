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
