import { getAttachmentOwnerSummaries, getAttachments } from '../attachments/attachmentRepository';
import { findBestSearchMatch } from './searchUtils';
import type { SearchProvider, SearchResult } from './searchTypes';

const ownerTypeLabels = {
  topic: 'Tema',
  medication: 'Farmaco',
  procedure: 'Procedimiento'
} as const;

export const attachmentsSearchProvider: SearchProvider = {
  id: 'attachments',
  type: 'attachment',
  async search(query, context) {
    const attachments = await getAttachments(context.userId);

    const results = await Promise.all(
      attachments.map(async (attachment): Promise<SearchResult | null> => {
        const owners = await getAttachmentOwnerSummaries(context.userId, attachment.id);
        const ownerLabels = owners.map((owner) => owner.label);
        const ownerTypeNames = owners.map((owner) => ownerTypeLabels[owner.ownerType]);
        const title = attachment.original_filename || attachment.filename;
        const match = findBestSearchMatch(query, [
          { field: 'title', value: [title, attachment.filename] },
          { field: 'metadata', value: attachment.mime_type },
          { field: 'owner', value: [...ownerLabels, ...ownerTypeNames] }
        ]);

        if (!match) return null;

        return {
          id: attachment.id,
          type: 'attachment',
          title,
          subtitle: owners.length > 0 ? owners.map((owner) => `${ownerTypeLabels[owner.ownerType]}: ${owner.label}`).join(' · ') : attachment.mime_type,
          matchedField: match.matchedField,
          snippet: match.snippet,
          route: owners[0]?.href ?? '/archivos',
          score: match.score,
          metadata: {
            mimeType: attachment.mime_type,
            size: attachment.size,
            ownerCount: owners.length,
            firstOwnerType: owners[0]?.ownerType,
            firstOwnerId: owners[0]?.ownerId,
            updatedAt: attachment.updated_at
          }
        };
      })
    );

    return results.filter((result): result is SearchResult => Boolean(result));
  }
};
