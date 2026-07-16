import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import type { MedicationFormValues, MedicationWithRelations } from '../../types/medication';
import {
  deleteMedication,
  duplicateMedication,
  loadMedicationData,
  saveMedication,
  toggleMedicationFavorite
} from './medicationRepository';

export const medicationDataKey = ['medication-data'];

export function useMedicationData() {
  const { user } = useAuth();

  return useQuery({
    queryKey: [...medicationDataKey, user?.id],
    queryFn: () => loadMedicationData(user!.id),
    enabled: Boolean(user?.id)
  });
}

export function useMedicationMutations() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: medicationDataKey });
  };

  return {
    saveMedication: useMutation({
      mutationFn: ({ values, existing }: { values: MedicationFormValues; existing?: MedicationWithRelations }) =>
        saveMedication(user!.id, values, existing),
      onSuccess: invalidate
    }),
    deleteMedication: useMutation({
      mutationFn: (medicationId: string) => deleteMedication(user!.id, medicationId),
      onSuccess: invalidate
    }),
    duplicateMedication: useMutation({
      mutationFn: (medication: MedicationWithRelations) => duplicateMedication(user!.id, medication),
      onSuccess: invalidate
    }),
    toggleFavorite: useMutation({
      mutationFn: (medication: MedicationWithRelations) => toggleMedicationFavorite(user!.id, medication),
      onSuccess: invalidate
    })
  };
}
