import { loadMedicationData } from '../medications/medicationRepository';
import { medicationStudySections } from '../medications/medicationStudySectionCatalog';
import { getExportAttachmentReferences } from './exportAttachmentReferences';
import type { ExportImageReference, ExportProvider, ExportSection } from './exportTypes';
import { tiptapToExportBlocks } from './tiptapToExportBlocks';

export const medicationExportProvider: ExportProvider = {
  type: 'medication',
  async createDocument(userId, entityId) {
    const data = await loadMedicationData(userId, false);
    const medication = data.medications.find((item) => item.id === entityId);
    if (!medication) throw new Error('No se encontró el fármaco en los datos locales.');

    const images: ExportImageReference[] = [];
    const sections: ExportSection[] = medicationStudySections.map((section) => {
      const converted = tiptapToExportBlocks(medication[section.jsonField], section.key, section.title);
      images.push(...converted.images);
      return {
        id: section.key,
        title: section.title,
        level: 1,
        blocks: converted.blocks
      };
    });

    return {
      title: medication.generic_name || 'Medicamento sin nombre',
      subtitle: medication.short_description ?? undefined,
      type: 'medication',
      metadata: {
        exportedAt: new Date().toISOString(),
        exporterVersion: '1',
        documentType: 'medication',
        entityId: medication.id,
        createdAt: medication.created_at,
        updatedAt: medication.updated_at,
        group: medication.pharmacologic_group,
        subgroup: medication.pharmacologic_subgroup,
        status: medication.status,
        favorite: medication.is_favorite
      },
      sections,
      attachments: await getExportAttachmentReferences(userId, 'medication', medication.id),
      images
    };
  }
};
