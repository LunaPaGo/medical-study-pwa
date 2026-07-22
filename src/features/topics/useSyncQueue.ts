import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { medicationDataKey } from '../medications/useMedicationData';
import { procedureDataKey } from '../procedures/useProcedureData';
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
  const [retryBlockedUntil, setRetryBlockedUntil] = useState<string | null>(null);
  const [retryTick, setRetryTick] = useState(0);
  const pendingCount = useSyncQueueCount();

  useEffect(() => {
    if (!user?.id || !isOnline || pendingCount === 0 || isSyncing) return;

    const retryBlockedUntilTime = retryBlockedUntil ? Date.parse(retryBlockedUntil) : 0;
    if (retryBlockedUntilTime > Date.now()) return;

    setIsSyncing(true);
    flushSyncQueue(user.id)
      .then((result) => {
        queryClient.invalidateQueries({ queryKey: topicDataKey });
        queryClient.invalidateQueries({ queryKey: medicationDataKey });
        queryClient.invalidateQueries({ queryKey: procedureDataKey });
        if (result.nextRetryAt && (result.failed > 0 || result.attempted === 0)) {
          setRetryBlockedUntil(result.nextRetryAt);
        } else {
          setRetryBlockedUntil(null);
        }
      })
      .catch((error) => {
        if (import.meta.env.DEV) {
          console.warn('[sync_queue] flush_unhandled_error', error);
        }
      })
      .finally(() => setIsSyncing(false));
  }, [isOnline, isSyncing, pendingCount, queryClient, retryBlockedUntil, retryTick, user?.id]);

  useEffect(() => {
    if (!retryBlockedUntil) return;

    const delay = Date.parse(retryBlockedUntil) - Date.now();
    if (delay <= 0) {
      setRetryBlockedUntil(null);
      setRetryTick((current) => current + 1);
      return;
    }

    const timeout = window.setTimeout(() => {
      setRetryBlockedUntil(null);
      setRetryTick((current) => current + 1);
    }, delay);
    return () => window.clearTimeout(timeout);
  }, [retryBlockedUntil]);

  return { pendingCount, isSyncing };
}
