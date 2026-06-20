import { create } from 'zustand';
import { Store, BatchAnomaly, MeetingNote, WeeklyOverdueItem, AnomalyStatusHistory } from '@/types';
import { stores } from '@/data/stores';
import { batches as initialBatches, batches } from '@/data/batches';

interface AnomalyUpdate {
  assignee?: string;
  deadline?: string;
  status?: BatchAnomaly['status'];
  historyEntry?: AnomalyStatusHistory;
}

interface StoreState {
  selectedStoreId: string | null;
  selectedStore: Store | null;
  setSelectedStore: (storeId: string | null) => void;
  clearSelectedStore: () => void;

  batchAnomalies: Map<string, BatchAnomaly>;
  updateBatchAnomaly: (batchId: string, update: AnomalyUpdate) => void;
  setBatchAnomaly: (batchId: string, anomaly: BatchAnomaly | null) => void;
  getBatchAnomaly: (batchId: string) => BatchAnomaly | undefined;

  meetingNotes: MeetingNote[];
  addMeetingNote: (note: Omit<MeetingNote, 'id' | 'createdAt'>) => void;
  updateMeetingNote: (id: string, update: Partial<MeetingNote>) => void;
  getStoreNotes: (storeId: string) => MeetingNote[];
  getTargetNotes: (targetType: MeetingNote['targetType'], targetId: string) => MeetingNote[];

  overdueItems: Map<string, WeeklyOverdueItem[]>;
  updateOverdueItem: (storeId: string, item: WeeklyOverdueItem) => void;
}

const initialAnomalies = new Map<string, BatchAnomaly>();
initialBatches.forEach((b) => {
  if (b.anomaly) {
    initialAnomalies.set(b.id, {
      ...b.anomaly,
      status: b.anomaly.status || 'pending',
    });
  }
});

const initialOverdueMap = new Map<string, WeeklyOverdueItem[]>();
stores.forEach((s) => {
  if (s.overdueItems && s.overdueItems.length > 0) {
    initialOverdueMap.set(s.id, s.overdueItems);
  }
});

export const useStore = create<StoreState>((set, get) => ({
  selectedStoreId: null,
  selectedStore: null,
  setSelectedStore: (storeId) => {
    const store = stores.find((s) => s.id === storeId) || null;
    set({ selectedStoreId: storeId, selectedStore: store });
  },
  clearSelectedStore: () => {
    set({ selectedStoreId: null, selectedStore: null });
  },

  batchAnomalies: initialAnomalies,
  updateBatchAnomaly: (batchId, update) => {
    set((state) => {
      const newMap = new Map(state.batchAnomalies);
      const existing = newMap.get(batchId);
      if (!existing) return {};
      const updated: BatchAnomaly = {
        ...existing,
        ...(update.assignee && { assignee: update.assignee }),
        ...(update.deadline && { deadline: update.deadline }),
        ...(update.status && { status: update.status }),
        ...(update.historyEntry && {
          statusHistory: [...(existing.statusHistory || []), update.historyEntry],
        }),
      };
      newMap.set(batchId, updated);
      return { batchAnomalies: newMap };
    });
  },
  setBatchAnomaly: (batchId, anomaly) => {
    set((state) => {
      const newMap = new Map(state.batchAnomalies);
      if (anomaly === null) {
        newMap.delete(batchId);
      } else {
        newMap.set(batchId, anomaly);
      }
      return { batchAnomalies: newMap };
    });
  },
  getBatchAnomaly: (batchId) => {
    return get().batchAnomalies.get(batchId);
  },

  meetingNotes: [
    {
      id: 'note-1',
      storeId: '3',
      targetType: 'store',
      targetId: '3',
      content: '广州天河店本周逾期严重，主要原因是分盒人力不足，需要协调支援。',
      actionItems: ['协调总部2名分盒专员支援', '周五前完成积压分盒', '重新排班增加晚班人手'],
      assignees: ['李督导', '广州天河店长'],
      dueDate: '2026-06-27',
      createdAt: '2026-06-20',
      createdBy: '王总部',
      status: 'open',
    },
    {
      id: 'note-2',
      storeId: '5',
      targetType: 'patient',
      targetId: 'p3',
      content: '王芳患者连续2次缺诊，客服电话未接通，需要安排到店沟通。',
      actionItems: ['本周内安排上门沟通', '确认患者联系方式是否变更'],
      assignees: ['杭州客服-陈雅'],
      dueDate: '2026-06-22',
      createdAt: '2026-06-20',
      createdBy: '周会记录',
      status: 'in_progress',
    },
  ],
  addMeetingNote: (note) => {
    set((state) => ({
      meetingNotes: [
        {
          ...note,
          id: `note-${Date.now()}`,
          createdAt: new Date().toISOString().split('T')[0],
        },
        ...state.meetingNotes,
      ],
    }));
  },
  updateMeetingNote: (id, update) => {
    set((state) => ({
      meetingNotes: state.meetingNotes.map((n) =>
        n.id === id ? { ...n, ...update } : n
      ),
    }));
  },
  getStoreNotes: (storeId) => {
    return get().meetingNotes.filter((n) => n.storeId === storeId);
  },
  getTargetNotes: (targetType, targetId) => {
    return get().meetingNotes.filter(
      (n) => n.targetType === targetType && n.targetId === targetId
    );
  },

  overdueItems: initialOverdueMap,
  updateOverdueItem: (storeId, item) => {
    set((state) => {
      const newMap = new Map(state.overdueItems);
      const list = newMap.get(storeId) || [];
      const updated = list.map((i) => (i.id === item.id ? item : i));
      newMap.set(storeId, updated);
      return { overdueItems: newMap };
    });
  },
}));
