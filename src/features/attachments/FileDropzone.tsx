import { ChangeEvent, DragEvent, useEffect, useRef, useState } from 'react';
import { Camera, Clipboard, FileUp, ImagePlus, X } from 'lucide-react';
import type { AttachmentOwnerType } from '../../types/attachment';
import { useAttachmentMutations } from './useAttachments';

type Props = {
  owner?: { ownerType: AttachmentOwnerType; ownerId: string };
  onUploaded?: (attachmentId: string) => void;
  compact?: boolean;
};

export function FileDropzone({ owner, onUploaded, compact = false }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const mutations = useAttachmentMutations();
  const [isDragging, setIsDragging] = useState(false);
  const [queuedNames, setQueuedNames] = useState<string[]>([]);

  const uploadFiles = (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    setQueuedNames(fileArray.map((file) => file.name));
    fileArray.forEach((file) => {
      mutations.upload.mutate(
        { file, owner },
        {
          onSuccess(attachment) {
            onUploaded?.(attachment.id);
          }
        }
      );
    });
  };

  const handleInput = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) uploadFiles(event.target.files);
    event.target.value = '';
  };

  const drop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    uploadFiles(event.dataTransfer.files);
  };

  useEffect(() => {
    const paste = (event: ClipboardEvent) => {
      const files = Array.from(event.clipboardData?.files ?? []);
      if (files.length > 0) uploadFiles(files);
    };

    window.addEventListener('paste', paste);
    return () => window.removeEventListener('paste', paste);
  });

  return (
    <section
      className={`dropzone ${compact ? 'compact' : ''} ${isDragging ? 'dragging' : ''}`}
      onDragOver={(event) => {
        event.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={drop}
    >
      <input ref={inputRef} hidden multiple type="file" onChange={handleInput} />
      <input ref={cameraInputRef} hidden accept="image/*" capture="environment" type="file" onChange={handleInput} />

      <div className="dropzone-icon">
        <FileUp size={28} />
      </div>
      <div>
        <strong>{compact ? 'Agregar archivo' : 'Soltá archivos, pegá capturas o seleccioná desde tu dispositivo'}</strong>
        {!compact && <p>Imágenes, PDF, Word, Excel, PowerPoint, texto y otros archivos de estudio.</p>}
      </div>
      <div className="dropzone-actions">
        <button className="primary-button" type="button" onClick={() => inputRef.current?.click()}>
          <ImagePlus size={18} />
          Galería / archivos
        </button>
        <button className="ghost-button" type="button" onClick={() => cameraInputRef.current?.click()}>
          <Camera size={18} />
          Cámara
        </button>
        <span className="ghost-button">
          <Clipboard size={18} />
          Ctrl+V
        </span>
      </div>
      {queuedNames.length > 0 && (
        <div className="upload-progress">
          <span>Procesando {queuedNames.length} archivo(s)</span>
          <button className="ghost-button icon-button" type="button" onClick={() => setQueuedNames([])} title="Limpiar estado">
            <X size={16} />
          </button>
        </div>
      )}
    </section>
  );
}
