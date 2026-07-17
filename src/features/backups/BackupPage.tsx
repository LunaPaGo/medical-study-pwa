import { useEffect, useState } from 'react';
import { AlertTriangle, Archive, CheckCircle2, DownloadCloud, FileSearch, XCircle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { createCompleteBackup, getLastBackupExport } from './backupExportService';
import { validateBackupZip } from './backupValidation';
import type { BackupExportResult, BackupProgress, BackupValidationResult } from './backupTypes';

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
    setError('');
    try {
      setValidation(await validateBackupZip(selectedZip));
    } catch (validationError) {
      setError(validationError instanceof Error ? validationError.message : 'No se pudo analizar el respaldo.');
    } finally {
      setIsValidating(false);
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
          </div>
        )}
      </section>
    </section>
  );
}
