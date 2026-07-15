import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import type { Attachment, AttachmentOwnerType } from '../../types/attachment';
import { createAttachment, deleteAttachment, getAttachments, renameAttachment } from './attachmentRepository';

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
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: attachmentsKey });

  return {
    upload: useMutation({
      mutationFn: ({ file, owner }: { file: File; owner?: { ownerType: AttachmentOwnerType; ownerId: string } }) =>
        createAttachment(user!.id, file, owner),
      onSuccess: invalidate
    }),
    rename: useMutation({
      mutationFn: ({ attachment, filename }: { attachment: Attachment; filename: string }) =>
        renameAttachment(user!.id, attachment, filename),
      onSuccess: invalidate
    }),
    remove: useMutation({
      mutationFn: (attachment: Attachment) => deleteAttachment(user!.id, attachment),
      onSuccess: invalidate
    })
  };
}
