import { RefreshCcw } from 'lucide-react';
import { useAutomaticTopicSync } from '../../features/topics/useSyncQueue';
import { useAuth } from '../../hooks/useAuth';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';

export function StatusBar() {
  const isOnline = useOnlineStatus();
  const { isReadOnly } = useAuth();
  const { pendingCount, isSyncing } = useAutomaticTopicSync();
  const syncMessage = isSyncing
    ? 'Reconectando...'
    : pendingCount > 0
      ? `${pendingCount} cambio${pendingCount === 1 ? '' : 's'} pendiente${pendingCount === 1 ? '' : 's'}`
      : 'Sin cambios pendientes';

  return (
    <header className="status-bar">
      <div>
        <span className={isOnline ? 'status-dot online' : 'status-dot offline'} />
        {isReadOnly ? 'Offline: solo lectura' : isOnline ? 'Online' : 'Offline'}
      </div>
      <div>
        <RefreshCcw size={16} aria-hidden="true" />
        {syncMessage}
      </div>
    </header>
  );
}
