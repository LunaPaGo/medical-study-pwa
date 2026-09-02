import { RefreshCcw } from 'lucide-react';
import { useAutomaticTopicSync } from '../../features/topics/useSyncQueue';
import { useAuth } from '../../hooks/useAuth';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { InterfaceScaleControl } from './InterfaceScaleControl';

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
        {isReadOnly ? 'Offline: edición de Temas' : isOnline ? 'Online' : 'Offline'}
      </div>
      <div>
        <RefreshCcw size={16} aria-hidden="true" />
        {syncMessage}
      </div>
      <InterfaceScaleControl />
    </header>
  );
}
