import { useEffect, useMemo, useState } from 'react';
import { Grid2X2, List, RefreshCcw, Search, ShieldCheck } from 'lucide-react';
import type { Attachment, AttachmentViewMode } from '../../types/attachment';
import { useAuth } from '../../hooks/useAuth';
import type { AttachmentSyncSummary } from './attachmentRepository';
import { diagnoseAttachmentReconciliation, getAttachmentUsageSummary, getLastAttachmentSyncAt } from './attachmentRepository';
import { AttachmentCard } from './AttachmentCard';
import { AttachmentPreview } from './AttachmentPreview';
import { FileDropzone } from './FileDropzone';
import { useAttachmentMutations, useAttachments } from './useAttachments';

export function AttachmentLibrary() {
  const { data = [], isLoading } = useAttachments();
  const mutations = useAttachmentMutations();
  const { isReadOnly, user } = useAuth();
  const [query, setQuery] = useState('');
  const [viewMode, setViewMode] = useState<AttachmentViewMode>('grid');
  const [preview, setPreview] = useState<Attachment | null>(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [syncSummary, setSyncSummary] = useState<AttachmentSyncSummary | null>(null);
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    getLastAttachmentSyncAt(user.id).then(setLastSyncAt).catch(() => setLastSyncAt(null));
  }, [user?.id]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return data.filter((item) =>
      [item.filename, item.original_filename, item.mime_type].join(' ').toLowerCase().includes(needle)
    );
  }, [data, query]);

  const rename = (attachment: Attachment) => {
    const nextName = window.prompt('Nuevo nombre del archivo', attachment.filename);
    if (!nextName?.trim()) return;
    mutations.rename.mutate({ attachment, filename: nextName });
  };

  const remove = async (attachment: Attachment) => {
    const usage = await getAttachmentUsageSummary(attachment.user_id, attachment.id);
    const usageText =
      usage.total > 0
        ? `\n\nEstá asociado a ${usage.topics} tema(s), ${usage.medications} medicamento(s) y ${usage.procedures} procedimiento(s). Se quitarán esas asociaciones, pero no se eliminarán los temas, medicamentos ni procedimientos.`
        : '';
    if (!window.confirm(`¿Eliminar definitivamente "${attachment.filename}"?${usageText}`)) return;
    mutations.remove.mutate(attachment);
  };

  const diagnose = async () => {
    if (!user?.id) {
      setStatusMessage('Necesitás iniciar sesión para revisar la consistencia.');
      return;
    }
    try {
      const report = await diagnoseAttachmentReconciliation(user.id);
      setStatusMessage(
        `Revisión: ${report.localOnly} solo locales, ${report.remoteOnly} solo remotos, ${report.invalidStoragePath} rutas inválidas, ${report.remoteLinksMissingLocally} asociaciones remotas no locales, ${report.storageObjectsWithoutRecord} objetos sin registro.`
      );
    } catch {
      setStatusMessage('No se pudo completar la revisión de consistencia.');
    }
  };

  const pendingCount = data.filter((attachment) => attachment.sync_status && attachment.sync_status !== 'synced').length;

  const syncNow = () => {
    if (isReadOnly) {
      setStatusMessage('Sin conexión. No se pudo sincronizar.');
      return;
    }
    setStatusMessage('Sincronizando...');
    setSyncSummary(null);
    mutations.sync.mutate(undefined, {
      onSuccess(summary) {
        setSyncSummary(summary);
        if (summary.completedAt) setLastSyncAt(summary.completedAt);
        setStatusMessage(summary.errors.length > 0 ? 'Sincronización completada con errores.' : 'Sincronización completada.');
      },
      onError() {
        setStatusMessage('No se pudo sincronizar archivos. Revisá la conexión.');
      }
    });
  };

  return (
    <section className="page-stack">
      <div className="page-heading page-heading-actions">
        <div>
          <span>Etapa 3</span>
          <h1>Archivos e imágenes</h1>
          <p>Biblioteca reutilizable para adjuntos de temas, farmacología y futuras secciones.</p>
        </div>
        <div className="heading-actions">
          <button className="ghost-button icon-button" type="button" onClick={() => setViewMode('grid')} title="Galería">
            <Grid2X2 size={18} />
          </button>
          <button className="ghost-button icon-button" type="button" onClick={() => setViewMode('list')} title="Lista">
            <List size={18} />
          </button>
          <button className="primary-button" type="button" onClick={syncNow} disabled={isReadOnly || mutations.sync.isPending}>
            <RefreshCcw size={18} />
            {mutations.sync.isPending ? 'Sincronizando...' : 'Sincronizar'}
          </button>
          {!isReadOnly && (
            <button className="ghost-button" type="button" onClick={diagnose}>
              <ShieldCheck size={18} />
              Revisar consistencia
            </button>
          )}
        </div>
      </div>

      {isReadOnly ? <div className="notice warning">Modo sin conexión: solo podés consultar archivos ya disponibles en este dispositivo.</div> : <FileDropzone />}
      <div className={`notice ${pendingCount > 0 ? 'warning' : ''}`}>
        Estado de archivos: {pendingCount > 0 ? `${pendingCount} elemento(s) pendiente(s)` : 'sincronizado'}
        {lastSyncAt ? ` · Última sincronización: ${new Date(lastSyncAt).toLocaleString('es')}` : ''}
        {isReadOnly ? ' · Sin conexión' : ''}
      </div>
      {statusMessage && <div className="notice">{statusMessage}</div>}
      {syncSummary && (
        <div className={`notice ${syncSummary.errors.length > 0 ? 'warning' : ''}`}>
          Subidos: {syncSummary.uploaded} · Descargados: {syncSummary.downloaded} · Asociaciones actualizadas: {syncSummary.associationsUpdated} · Eliminados localmente: {syncSummary.deletedLocal} · Pendientes limpiados: {syncSummary.cleanedOrphans} · Conflictos: {syncSummary.conflicts}
          {syncSummary.errors.length > 0 ? ` · Errores: ${syncSummary.errors.join(' | ')}` : ''}
        </div>
      )}

      <section className="panel filter-panel attachment-filter">
        <Search size={20} />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por nombre o tipo de archivo" />
      </section>

      {isLoading && <div className="panel empty-state">Cargando archivos...</div>}

      <div className={`attachment-list ${viewMode}`}>
        {filtered.map((attachment) => (
          <AttachmentCard
            key={attachment.id}
            attachment={attachment}
            viewMode={viewMode}
            onPreview={setPreview}
            onRename={rename}
            onRemove={remove}
            readOnly={isReadOnly}
          />
        ))}
      </div>

      {!isLoading && filtered.length === 0 && <div className="panel empty-state">Todavía no hay archivos con estos filtros.</div>}
      {preview && <AttachmentPreview attachment={preview} onClose={() => setPreview(null)} />}
    </section>
  );
}
