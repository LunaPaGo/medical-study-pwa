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
  const { user, isReadOnly } = useAuth();
  const queryClient = useQueryClient();
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: medicationDataKey });
  };
  const ensureWritable = () => {
    if (isReadOnly) throw new Error('Modo sin conexión: solo lectura.');
  };

  return {
    saveMedication: useMutation({
      mutationFn: ({ values, existing }: { values: MedicationFormValues; existing?: MedicationWithRelations }) => {
        ensureWritable();
        return saveMedication(user!.id, values, existing);
      },
      onSuccess: invalidate
    }),
    deleteMedication: useMutation({
      mutationFn: (medicationId: string) => {
        ensureWritable();
        return deleteMedication(user!.id, medicationId);
      },
      onSuccess: invalidate
    }),
    duplicateMedication: useMutation({
      mutationFn: (medication: MedicationWithRelations) => {
        ensureWritable();
        return duplicateMedication(user!.id, medication);
      },
      onSuccess: invalidate
    }),
    toggleFavorite: useMutation({
      mutationFn: (medication: MedicationWithRelations) => {
        ensureWritable();
        return toggleMedicationFavorite(user!.id, medication);
      },
      onSuccess: invalidate
    })
  };
}
