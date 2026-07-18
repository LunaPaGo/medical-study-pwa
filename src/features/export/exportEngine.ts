import { medicationExportProvider } from './medicationExportProvider';
import { procedureExportProvider } from './procedureExportProvider';
import { topicExportProvider } from './topicExportProvider';
import type { ExportEntityType, ExportProvider } from './exportTypes';

export const exportProviders: ExportProvider[] = [topicExportProvider, medicationExportProvider, procedureExportProvider];

export async function createExportDocument(type: ExportEntityType, userId: string, entityId: string) {
  const provider = exportProviders.find((item) => item.type === type);
  if (!provider) {
    throw new Error(`No hay proveedor de exportación para ${type}.`);
  }

  return provider.createDocument(userId, entityId);
}

export type {
  ExportAttachmentReference,
  ExportBlock,
  ExportDocument,
  ExportEntityType,
  ExportImageReference,
  ExportProvider,
  ExportSection,
  ExportTextRun
} from './exportTypes';
