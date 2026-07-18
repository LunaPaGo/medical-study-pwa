import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import type { Attachment, AttachmentOwnerType } from '../../types/attachment';
import { medicationDataKey } from '../medications/useMedicationData';
import { procedureDataKey } from '../procedures/useProcedureData';
import { topicDataKey } from '../topics/useTopicData';
import { createAttachment, deleteAttachment, getAttachments, renameAttachment, runManualAttachmentSync } from './attachmentRepository';

export const attachmentsKey = ['attachments'];

export function useAttachments() {
  const { user } = useAuth();

  return useQuery({
    queryKey: [...attachmentsKey, user?.id],
    queryFn: () => getAttachments(user!.id),
    enabled: Boolean(user?.id)
  });
}

export function useAttachmentMutations() {
  const { user, isReadOnly } = useAuth();
  const queryClient = useQueryClient();
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: attachmentsKey });
    queryClient.invalidateQueries({ queryKey: topicDataKey });
    queryClient.invalidateQueries({ queryKey: medicationDataKey });
    queryClient.invalidateQueries({ queryKey: procedureDataKey });
  };
  const ensureWritable = () => {
    if (isReadOnly) throw new Error('Modo sin conexión: solo lectura.');
  };

  return {
    upload: useMutation({
      mutationFn: ({ file, owner }: { file: File; owner?: { ownerType: AttachmentOwnerType; ownerId: string } }) => {
        ensureWritable();
        return createAttachment(user!.id, file, owner);
      },
      onSuccess: invalidate
    }),
    rename: useMutation({
      mutationFn: ({ attachment, filename }: { attachment: Attachment; filename: string }) => {
        ensureWritable();
        return renameAttachment(user!.id, attachment, filename);
      },
      onSuccess: invalidate
    }),
    remove: useMutation({
      mutationFn: (attachment: Attachment) => {
        ensureWritable();
        return deleteAttachment(user!.id, attachment);
      },
      onSuccess: invalidate
    }),
    sync: useMutation({
      mutationFn: () => runManualAttachmentSync(user!.id),
      onSuccess: invalidate
    })
  };
}
