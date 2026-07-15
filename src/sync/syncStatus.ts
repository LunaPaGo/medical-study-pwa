export type SyncState = 'idle' | 'pending' | 'syncing' | 'error';

export type SyncSummary = {
  state: SyncState;
  pendingItems: number;
  lastSyncAt?: string;
  message: string;
};

export const initialSyncSummary: SyncSummary = {
  state: 'idle',
  pendingItems: 0,
  message: 'Sin cambios pendientes'
};
