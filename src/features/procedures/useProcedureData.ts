import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import type { ProcedureFormValues, ProcedureWithRelations } from '../../types/procedure';
import { deleteProcedure, loadProcedureData, saveProcedure, toggleProcedureFavorite } from './procedureRepository';

export const procedureDataKey = ['procedure-data'];

export function useProcedureData() {
  const { user } = useAuth();

  return useQuery({
    queryKey: [...procedureDataKey, user?.id],
    queryFn: () => loadProcedureData(user!.id),
    enabled: Boolean(user?.id)
  });
}

export function useProcedureMutations() {
  const { user, isReadOnly } = useAuth();
  const queryClient = useQueryClient();
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: procedureDataKey });
  };
  const ensureWritable = () => {
    if (isReadOnly) throw new Error('Modo sin conexión: solo lectura.');
  };

  return {
    saveProcedure: useMutation({
      mutationFn: ({ values, existing }: { values: ProcedureFormValues; existing?: ProcedureWithRelations }) => {
        ensureWritable();
        return saveProcedure(user!.id, values, existing);
      },
      onSuccess: invalidate
    }),
    deleteProcedure: useMutation({
      mutationFn: (procedureId: string) => {
        ensureWritable();
        return deleteProcedure(user!.id, procedureId);
      },
      onSuccess: invalidate
    }),
    toggleFavorite: useMutation({
      mutationFn: (procedure: ProcedureWithRelations) => {
        ensureWritable();
        return toggleProcedureFavorite(user!.id, procedure);
      },
      onSuccess: invalidate
    })
  };
}
