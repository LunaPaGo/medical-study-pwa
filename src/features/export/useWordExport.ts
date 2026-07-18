import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { createExportDocument } from './exportEngine';
import type { ExportEntityType } from './exportTypes';
import { downloadBlob } from './downloadBlob';
import { createWordDocument } from './word/wordExporter';
import { createWordFileName } from './word/wordFileName';

type WordExportState = {
  isExporting: boolean;
  message: string;
  error: string;
};

export function useWordExport(entityType: ExportEntityType, entityId: string | undefined) {
  const { user } = useAuth();
  const [state, setState] = useState<WordExportState>({
    isExporting: false,
    message: '',
    error: ''
  });

  const exportToWord = async () => {
    if (state.isExporting) return;

    if (!user || !entityId) {
      setState({ isExporting: false, message: '', error: 'No se pudo generar el documento Word.' });
      return;
    }

    setState({ isExporting: true, message: '', error: '' });

    try {
      const exportDocument = await createExportDocument(entityType, user.id, entityId);
      const blob = await createWordDocument(exportDocument);
      downloadBlob(blob, createWordFileName(exportDocument));
      setState({ isExporting: false, message: 'Documento Word generado', error: '' });
    } catch (error) {
      console.error('WORD_EXPORT_FAILED', error);
      setState({ isExporting: false, message: '', error: 'No se pudo generar el documento Word.' });
    }
  };

  return {
    ...state,
    exportToWord
  };
}
