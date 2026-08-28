import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import type { ClinicalApproach } from './clinicalApproachTypes';
import { deleteClinicalApproachLocal, getClinicalApproach, listClinicalApproachCategories, listClinicalApproaches, saveClinicalApproach } from './clinicalApproachRepository';

export const clinicalApproachesKey = ['clinical-approaches-local'];

export function useClinicalApproaches() {
  const { user } = useAuth();
  return useQuery({ queryKey: [...clinicalApproachesKey, user?.id], queryFn: () => listClinicalApproaches(user!.id), enabled: Boolean(user?.id) });
}

export function useClinicalApproach(id?: string) {
  const { user } = useAuth();
  return useQuery({ queryKey: [...clinicalApproachesKey, user?.id, id], queryFn: () => getClinicalApproach(user!.id, id!), enabled: Boolean(user?.id && id) });
}

export function useClinicalApproachCategories() {
  const { user } = useAuth();
  return useQuery({ queryKey: [...clinicalApproachesKey, 'categories', user?.id], queryFn: () => listClinicalApproachCategories(user!.id), enabled: Boolean(user?.id) });
}

export function useClinicalApproachMutations() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const requireUser = () => {
    if (!user?.id) throw new Error('Se requiere una sesión local aprobada para guardar abordajes.');
    return user.id;
  };
  const invalidate = () => queryClient.invalidateQueries({ queryKey: clinicalApproachesKey });
  return {
    save: useMutation({ mutationFn: (approach: ClinicalApproach) => saveClinicalApproach(requireUser(), approach), onSuccess: invalidate }),
    remove: useMutation({ mutationFn: (id: string) => deleteClinicalApproachLocal(requireUser(), id), onSuccess: invalidate })
  };
}
