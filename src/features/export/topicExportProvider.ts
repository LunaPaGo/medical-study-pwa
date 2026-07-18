import { loadTopicData } from '../topics/topicRepository';
import { topicSections } from '../topics/topicSectionCatalog';
import { getExportAttachmentReferences } from './exportAttachmentReferences';
import type { ExportImageReference, ExportProvider, ExportSection } from './exportTypes';
import { tiptapToExportBlocks } from './tiptapToExportBlocks';

export const topicExportProvider: ExportProvider = {
  type: 'topic',
  async createDocument(userId, entityId) {
    const data = await loadTopicData(userId, false);
    const topic = data.topics.find((item) => item.id === entityId);
    if (!topic) throw new Error('No se encontró el tema en los datos locales.');

    const images: ExportImageReference[] = [];
    const sections: ExportSection[] = topicSections.map((section) => {
      const converted = tiptapToExportBlocks(topic[section.jsonField], section.key, section.title);
      images.push(...converted.images);
      return {
        id: section.key,
        title: section.title,
        level: 1,
        blocks: converted.blocks
      };
    });

    return {
      title: topic.title,
      subtitle: topic.subtitle ?? undefined,
      type: 'topic',
      metadata: {
        exportedAt: new Date().toISOString(),
        exporterVersion: '1',
        documentType: 'topic',
        entityId: topic.id,
        createdAt: topic.created_at,
        updatedAt: topic.updated_at,
        category: topic.category?.name,
        folder: topic.folder?.name,
        specialty: topic.specialty,
        status: topic.status,
        favorite: topic.is_favorite
      },
      sections,
      attachments: await getExportAttachmentReferences(userId, 'topic', topic.id),
      images
    };
  }
};
