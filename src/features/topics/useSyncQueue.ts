import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { flushSyncQueue, getPendingSyncCount } from './topicRepository';
import { topicDataKey } from './useTopicData';

export function useSyncQueueCount() {
  const { user } = useAuth();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!user?.id) return;

    const refresh = () => {
      getPendingSyncCount(user.id).then(setCount).catch(() => setCount(0));
    };

    refresh();
    window.addEventListener('sync-queue-changed', refresh);
    return () => window.removeEventListener('sync-queue-changed', refresh);
  }, [user?.id]);

  return count;
}

export function useAutomaticTopicSync() {
  const { user } = useAuth();
  const isOnline = useOnlineStatus();
  const queryClient = useQueryClient();
  const [isSyncing, setIsSyncing] = useState(false);
  const pendingCount = useSyncQueueCount();

  useEffect(() => {
    if (!user?.id || !isOnline || pendingCount === 0 || isSyncing) return;

    setIsSyncing(true);
    flushSyncQueue(user.id)
      .then(() => queryClient.invalidateQueries({ queryKey: topicDataKey }))
      .finally(() => setIsSyncing(false));
  }, [isOnline, isSyncing, pendingCount, queryClient, user?.id]);

  return { pendingCount, isSyncing };
}
