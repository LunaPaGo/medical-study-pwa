import { useEffect, useState } from 'react';
import { AlertTriangle, Archive, CheckCircle2, DownloadCloud, FileSearch, RotateCcw, XCircle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { createCompleteBackup, getLastBackupExport } from './backupExportService';
import { createMergePreview, restoreBackupMerge } from './backupMergeService';
import { validateBackupZip } from './backupValidation';
import type { BackupExportResult, BackupProgress, BackupValidationResult } from './backupTypes';
import type { BackupMergePreview, BackupMergeResult, RestoreProgress } from './backupRestoreTypes';

type LastExport = {
  filename: string;
  size: number;
  created_at: string;
  complete: boolean;
  warnings: number;
};

const initialProgress: BackupProgress = {
  step: 'idle',
  message: 'Listo para crear una copia de seguridad.'
};

const initialRestoreProgress: RestoreProgress = {
  step: 'idle',
  message: 'Listo para preparar una restauración combinada.'
};

function downloadBlob(result: BackupExportResult) {
  const url = URL.createObjectURL(result.blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = result.filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function downloadRestoreReport(result: BackupMergeResult) {
  const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `medical-study-restore-report-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

export function BackupPage() {
  const { user, isReadOnly } = useAuth();
  const [progress, setProgress] = useState<BackupProgress>(initialProgress);
  const [isExporting, setIsExporting] = useState(false);
  const [lastExport, setLastExport] = useState<LastExport | null>(null);
  const [result, setResult] = useState<BackupExportResult | null>(null);
  const [selectedZip, setSelectedZip] = useState<File | null>(null);
  const [validation, setValidation] = useState<BackupValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [mergePreview, setMergePreview] = useState<BackupMergePreview | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [restoreProgress, setRestoreProgress] = useState<RestoreProgress>(initialRestoreProgress);
  const [restoreResult, setRestoreResult] = useState<BackupMergeResult | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user?.id) return;
    getLastBackupExport(user.id).then((value) => setLastExport(value ?? null)).catch(() => setLastExport(null));
  }, [user?.id]);

  const createBackup = async () => {
    if (!user?.id || isExporting) return;
    setIsExporting(true);
    setError('');
    setResult(null);
    setProgress({ step: 'checking', message: 'Iniciando copia de seguridad...' });

    try {
      const backup = await createCompleteBackup({
        userId: user.id,
        onProgress: setProgress,
        onIncomplete: async (warnings) =>
          window.confirm(
            `La copia tiene advertencias y puede quedar incompleta:\n\n${warnings.slice(0, 8).join('\n')}${warnings.length > 8 ? '\n...' : ''}\n\n¿Querés continuar y descargarla igual?`
          )
      });
      setResult(backup);
      downloadBlob(backup);
      const stored = await getLastBackupExport(user.id);
      setLastExport(stored ?? null);
    } catch (backupError) {
      setProgress({ step: 'error', message: 'No se pudo crear la copia.' });
      setError(backupError instanceof Error ? backupError.message : 'Error inesperado al crear la copia.');
    } finally {
      setIsExporting(false);
    }
  };

  const analyzeBackup = async () => {
    if (!selectedZip || isValidating) return;
    setIsValidating(true);
    setValidation(null);
    setMergePreview(null);
    setRestoreResult(null);
    setRestoreProgress(initialRestoreProgress);
    setError('');
    try {
      setValidation(await validateBackupZip(selectedZip));
    } catch (validationError) {
      setError(validationError instanceof Error ? validationError.message : 'No se pudo analizar el respaldo.');
    } finally {
      setIsValidating(false);
    }
  };

  const prepareMergePreview = async () => {
    if (!selectedZip || !user?.id || isPreviewing) return;
    setIsPreviewing(true);
    setMergePreview(null);
    setRestoreResult(null);
    setRestoreProgress({ step: 'checking-current-data', message: 'Preparando vista previa de combinación...' });
    setError('');
    try {
      setMergePreview(await createMergePreview(selectedZip, user.id));
      setRestoreProgress({ step: 'idle', message: 'Vista previa lista. Revisá el resumen antes de restaurar.' });
    } catch (previewError) {
      setRestoreProgress({ step: 'error', message: 'No se pudo preparar la vista previa.' });
      setError(previewError instanceof Error ? previewError.message : 'No se pudo preparar la restauración.');
    } finally {
      setIsPreviewing(false);
    }
  };

  const restoreMerge = async () => {
    if (!selectedZip || !user?.id || !mergePreview || isRestoring) return;
    const confirmed = window.confirm(
      'Se combinará este respaldo con tus datos actuales. No se eliminará información existente. ¿Querés continuar?'
    );
    if (!confirmed) return;

    setIsRestoring(true);
    setRestoreResult(null);
    setError('');
    try {
      setRestoreResult(await restoreBackupMerge(selectedZip, user.id, setRestoreProgress));
    } catch (restoreError) {
      setRestoreProgress({ step: 'error', message: 'No se pudo completar la restauración combinada.' });
      setError(restoreError instanceof Error ? restoreError.message : 'Error inesperado al restaurar.');
    } finally {
      setIsRestoring(false);
    }
  };

  const validationTitle =
    validation?.status === 'valid'
      ? 'Respaldo válido.'
      : validation?.status === 'valid-with-warnings'
        ? 'Respaldo válido con advertencias.'
        : validation?.status === 'invalid'
          ? 'Respaldo inválido.'
          : '';

  return (
    <section className="page-stack">
      <div className="page-heading">
        <span>Respaldo</span>
        <h1>Copias de seguridad</h1>
        <p>Exportá tus temas, medicamentos y archivos físicos en un único ZIP independiente de Supabase.</p>
      </div>

      <section className="panel backup-panel">
        <div className="panel-title">
          <Archive size={20} aria-hidden="true" />
          <h2>Crear copia de seguridad</h2>
        </div>
        <p>
          La copia incluye datos, relaciones y archivos físicos. Para que sea completa, la aplicación necesita conexión a Internet.
        </p>

        {lastExport ? (
          <div className={`notice ${lastExport.complete ? '' : 'warning'}`}>
            Última copia en este dispositivo: {new Date(lastExport.created_at).toLocaleString('es')} · {lastExport.filename} · {formatSize(lastExport.size)}
            {!lastExport.complete ? ` · ${lastExport.warnings} advertencia(s)` : ''}
          </div>
        ) : (
          <div className="notice">Todavía no hay una copia registrada en este dispositivo.</div>
        )}

        {isReadOnly && <div className="notice warning">Modo sin conexión: una copia completa requiere Internet.</div>}

        <div className="backup-actions">
          <button className="primary-button" type="button" onClick={createBackup} disabled={isExporting || isReadOnly}>
            <DownloadCloud size={18} aria-hidden="true" />
            {isExporting ? 'Creando copia...' : 'Crear copia de seguridad'}
          </button>
        </div>

        <div className={`notice ${progress.step === 'error' ? 'warning' : ''}`}>
          {progress.message}
          {typeof progress.current === 'number' && typeof progress.total === 'number' ? ` (${progress.current}/${progress.total})` : ''}
        </div>

        {error && (
          <div className="notice warning">
            <AlertTriangle size={18} aria-hidden="true" />
            {error}
          </div>
        )}

        {result && (
          <div className={`notice ${result.manifest.complete ? '' : 'warning'}`}>
            {result.manifest.complete ? <CheckCircle2 size={18} aria-hidden="true" /> : <AlertTriangle size={18} aria-hidden="true" />}
            Copia generada: {result.filename} · {formatSize(result.blob.size)} · {result.manifest.complete ? 'Completa' : 'Incompleta'}
          </div>
        )}

        {result?.manifest.warnings.length ? (
          <div className="panel backup-warning-list">
            <strong>Advertencias</strong>
            <ul>
              {result.manifest.warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>

      <section className="panel backup-panel">
        <div className="panel-title">
          <Archive size={20} aria-hidden="true" />
          <h2>Restaurar copia de seguridad</h2>
        </div>
        <p>En esta etapa solo se analiza el ZIP. No se modifica Supabase, IndexedDB ni Storage.</p>

        <div className="backup-file-picker">
          <input
            type="file"
            accept=".zip,application/zip,application/x-zip-compressed"
            onChange={(event) => {
              setSelectedZip(event.target.files?.[0] ?? null);
              setValidation(null);
              setMergePreview(null);
              setRestoreResult(null);
              setRestoreProgress(initialRestoreProgress);
            }}
          />
          <button className="primary-button" type="button" onClick={analyzeBackup} disabled={!selectedZip || isValidating}>
            <FileSearch size={18} aria-hidden="true" />
            {isValidating ? 'Analizando...' : 'Analizar copia'}
          </button>
        </div>

        {selectedZip && <div className="notice">Archivo seleccionado: {selectedZip.name} · {formatSize(selectedZip.size)}</div>}

        {validation && (
          <div className="backup-validation">
            <div className={`notice ${validation.status === 'invalid' ? 'error' : validation.status === 'valid-with-warnings' ? 'warning' : 'success'}`}>
              {validation.status === 'invalid' ? <XCircle size={18} aria-hidden="true" /> : <CheckCircle2 size={18} aria-hidden="true" />}
              {validationTitle}
            </div>

            {validation.manifest && (
              <div className="backup-summary-grid">
                <div>
                  <span>Fecha</span>
                  <strong>{new Date(validation.manifest.created_at).toLocaleString('es')}</strong>
                </div>
                <div>
                  <span>Usuario exportador</span>
                  <strong>{validation.manifest.exported_by_user_id}</strong>
                </div>
                <div>
                  <span>Versión</span>
                  <strong>
                    {validation.manifest.backup_format} v{validation.manifest.backup_version}
                  </strong>
                </div>
                <div>
                  <span>Tamaño</span>
                  <strong>{formatSize(validation.size)}</strong>
                </div>
              </div>
            )}

            {Object.keys(validation.counts).length > 0 && (
              <div className="backup-count-grid">
                {Object.entries(validation.counts).map(([key, value]) => (
                  <div key={key}>
                    <span>{key}</span>
                    <strong>{value}</strong>
                  </div>
                ))}
              </div>
            )}

            <div className="backup-check-list">
              {validation.checks.map((item) => (
                <div className={`backup-check ${item.status}`} key={`${item.label}-${item.message}`}>
                  <strong>{item.label}</strong>
                  <span>{item.message}</span>
                </div>
              ))}
            </div>

            {validation.errors.length > 0 && (
              <div className="panel backup-warning-list">
                <strong>Errores</strong>
                <ul>
                  {validation.errors.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {validation.warnings.length > 0 && (
              <div className="panel backup-warning-list">
                <strong>Advertencias</strong>
                <ul>
                  {validation.warnings.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {validation.status !== 'invalid' && validation.manifest?.exported_by_user_id !== user?.id && (
              <div className="notice warning">
                <AlertTriangle size={18} aria-hidden="true" />
                Este respaldo pertenece a otro usuario. En esta versión no se permite restaurarlo.
              </div>
            )}

            {validation.status !== 'invalid' && validation.manifest?.exported_by_user_id === user?.id && (
              <div className="backup-actions">
                <button className="secondary-button" type="button" onClick={prepareMergePreview} disabled={isPreviewing || isRestoring || isReadOnly}>
                  <FileSearch size={18} aria-hidden="true" />
                  {isPreviewing ? 'Preparando...' : 'Preparar combinación'}
                </button>
              </div>
            )}
          </div>
        )}

        {(mergePreview || restoreResult) && (
          <div className="backup-validation">
            <div className={`notice ${restoreResult?.finalStatus === 'incomplete' || mergePreview?.status === 'blocked' ? 'error' : mergePreview?.status === 'ready-with-warnings' || restoreResult?.finalStatus === 'completed-with-warnings' ? 'warning' : 'success'}`}>
              {restoreResult ? (
                restoreResult.finalStatus === 'completed' ? 'Restauración completada.' : restoreResult.finalStatus === 'completed-with-warnings' ? 'Restauración completada con advertencias.' : 'Restauración incompleta.'
              ) : mergePreview?.status === 'ready' ? (
                'Vista previa lista para combinar.'
              ) : (
                'Vista previa lista con advertencias.'
              )}
            </div>

            <div className="backup-summary-grid">
              {Object.entries((restoreResult ?? mergePreview)!.entities).map(([key, item]) => (
                <div key={key}>
                  <span>{key}</span>
                  <strong>
                    +{item.created} · ↑{item.updated} · ={item.kept}
                  </strong>
                  <small>omitidos {item.skipped} · conflictos {item.conflicts}</small>
                </div>
              ))}
            </div>

            <div className="backup-count-grid">
              <div>
                <span>Archivos subidos</span>
                <strong>{(restoreResult ?? mergePreview)!.files.uploaded}</strong>
              </div>
              <div>
                <span>Archivos existentes</span>
                <strong>{(restoreResult ?? mergePreview)!.files.existing}</strong>
              </div>
              <div>
                <span>Archivos faltantes</span>
                <strong>{(restoreResult ?? mergePreview)!.files.missingInZip}</strong>
              </div>
              <div>
                <span>Archivos con conflicto</span>
                <strong>{(restoreResult ?? mergePreview)!.files.conflicts}</strong>
              </div>
            </div>

            <div className={`notice ${restoreProgress.step === 'error' ? 'warning' : ''}`}>
              {restoreProgress.message}
              {typeof restoreProgress.current === 'number' && typeof restoreProgress.total === 'number' ? ` (${restoreProgress.current}/${restoreProgress.total})` : ''}
            </div>

            {!restoreResult && mergePreview?.status !== 'blocked' && (
              <div className="backup-actions">
                <button className="primary-button" type="button" onClick={restoreMerge} disabled={isRestoring || isReadOnly}>
                  <RotateCcw size={18} aria-hidden="true" />
                  {isRestoring ? 'Restaurando...' : 'Restaurar combinando'}
                </button>
              </div>
            )}

            {restoreResult && (
              <div className="backup-actions">
                <button className="secondary-button" type="button" onClick={() => downloadRestoreReport(restoreResult)}>
                  <DownloadCloud size={18} aria-hidden="true" />
                  Descargar informe
                </button>
              </div>
            )}

            {(restoreResult ?? mergePreview)!.warnings.length > 0 && (
              <div className="panel backup-warning-list">
                <strong>Advertencias de restauración</strong>
                <ul>
                  {(restoreResult ?? mergePreview)!.warnings.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {[
              ...(restoreResult ?? mergePreview)!.errors,
              ...(restoreResult ?? mergePreview)!.files.errors,
              ...Object.entries((restoreResult ?? mergePreview)!.entities).flatMap(([key, item]) => item.errors.map((message) => `${key}: ${message}`))
            ].length > 0 && (
              <div className="panel backup-warning-list">
                <strong>Errores o conflictos</strong>
                <ul>
                  {[
                    ...(restoreResult ?? mergePreview)!.errors,
                    ...(restoreResult ?? mergePreview)!.files.errors,
                    ...Object.entries((restoreResult ?? mergePreview)!.entities).flatMap(([key, item]) => item.errors.map((message) => `${key}: ${message}`))
                  ].map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </section>
    </section>
  );
}
