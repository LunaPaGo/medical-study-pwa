import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import type { OrganizationKind, TopicFormValues, TopicWithRelations } from '../../types/topic';
import {
  deleteOrganizationItem,
  deleteTopic,
  duplicateTopic,
  loadTopicData,
  saveOrganizationItem,
  saveTopic,
  toggleFavorite
} from './topicRepository';

export const topicDataKey = ['topic-data'];

export function useTopicData() {
  const { user } = useAuth();

  return useQuery({
    queryKey: [...topicDataKey, user?.id],
    queryFn: () => loadTopicData(user!.id),
    enabled: Boolean(user?.id)
  });
}

export function useTopicMutations() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: topicDataKey });

  return {
    saveTopic: useMutation({
      mutationFn: ({ values, existing }: { values: TopicFormValues; existing?: TopicWithRelations }) =>
        saveTopic(user!.id, values, existing),
      onSuccess: invalidate
    }),
    deleteTopic: useMutation({
      mutationFn: (topicId: string) => deleteTopic(user!.id, topicId),
      onSuccess: invalidate
    }),
    duplicateTopic: useMutation({
      mutationFn: (topic: TopicWithRelations) => duplicateTopic(user!.id, topic),
      onSuccess: invalidate
    }),
    toggleFavorite: useMutation({
      mutationFn: (topic: TopicWithRelations) => toggleFavorite(user!.id, topic),
      onSuccess: invalidate
    }),
    saveOrganizationItem: useMutation({
      mutationFn: ({
        kind,
        values,
        existing
      }: {
        kind: OrganizationKind;
        values: { name: string; color?: string };
        existing?: { id: string; user_id: string; name: string; color: string | null; created_at: string; updated_at: string };
      }) => saveOrganizationItem(user!.id, kind, values, existing),
      onSuccess: invalidate
    }),
    deleteOrganizationItem: useMutation({
      mutationFn: ({ kind, id }: { kind: OrganizationKind; id: string }) => deleteOrganizationItem(user!.id, kind, id),
      onSuccess: invalidate
    })
  };
}
