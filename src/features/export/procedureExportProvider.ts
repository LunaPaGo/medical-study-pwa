import { loadProcedureData } from '../procedures/procedureRepository';
import { procedureStudySections } from '../procedures/procedureSectionCatalog';
import { getExportAttachmentReferences } from './exportAttachmentReferences';
import type { ExportImageReference, ExportProvider, ExportSection } from './exportTypes';
import { tiptapToExportBlocks } from './tiptapToExportBlocks';

export const procedureExportProvider: ExportProvider = {
  type: 'procedure',
  async createDocument(userId, entityId) {
    const data = await loadProcedureData(userId, false);
    const procedure = data.procedures.find((item) => item.id === entityId);
    if (!procedure) throw new Error('No se encontró el procedimiento en los datos locales.');

    const images: ExportImageReference[] = [];
    const sections: ExportSection[] = procedureStudySections.map((section) => {
      const converted = tiptapToExportBlocks(procedure[section.jsonField], section.key, section.title);
      images.push(...converted.images);
      return {
        id: section.key,
        title: section.title,
        level: 1,
        blocks: converted.blocks
      };
    });

    return {
      title: procedure.name,
      subtitle: procedure.summary ?? undefined,
      type: 'procedure',
      metadata: {
        exportedAt: new Date().toISOString(),
        exporterVersion: '1',
        documentType: 'procedure',
        entityId: procedure.id,
        createdAt: procedure.created_at,
        updatedAt: procedure.updated_at,
        category: procedure.category,
        status: procedure.status,
        favorite: procedure.is_favorite
      },
      sections,
      attachments: await getExportAttachmentReferences(userId, 'procedure', procedure.id),
      images
    };
  }
};
