import { RefreshCcw } from 'lucide-react';
import { useAutomaticTopicSync } from '../../features/topics/useSyncQueue';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';

export function StatusBar() {
  const isOnline = useOnlineStatus();
  const { pendingCount, isSyncing } = useAutomaticTopicSync();
  const syncMessage = isSyncing
    ? 'Sincronizando...'
    : pendingCount > 0
      ? `${pendingCount} cambio${pendingCount === 1 ? '' : 's'} pendiente${pendingCount === 1 ? '' : 's'}`
      : 'Sin cambios pendientes';

  return (
    <header className="status-bar">
      <div>
        <span className={isOnline ? 'status-dot online' : 'status-dot offline'} />
        {isOnline ? 'Online' : 'Offline'}
      </div>
      <div>
        <RefreshCcw size={16} aria-hidden="true" />
        {syncMessage}
      </div>
    </header>
  );
}
