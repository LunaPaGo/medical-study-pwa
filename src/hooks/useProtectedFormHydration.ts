import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react';

type UseProtectedFormHydrationOptions<TValues> = {
  initialValues: TValues;
  recordKey: string;
  recordUpdatedAt?: string | null;
};

function serializeFormValues(value: unknown) {
  return JSON.stringify(value);
}

export function useProtectedFormHydration<TValues>({
  initialValues,
  recordKey,
  recordUpdatedAt
}: UseProtectedFormHydrationOptions<TValues>) {
  const [values, setValuesState] = useState<TValues>(initialValues);
  const [isDirty, setIsDirty] = useState(false);
  const [hasExternalUpdate, setHasExternalUpdate] = useState(false);
  const recordKeyRef = useRef(recordKey);
  const baseSnapshotRef = useRef(serializeFormValues(initialValues));
  const dirtyRef = useRef(false);
  const pendingExternalValuesRef = useRef<TValues | null>(null);
  const pendingExternalSnapshotRef = useRef('');

  const setCleanValues = useCallback((nextValues: TValues) => {
    const nextSnapshot = serializeFormValues(nextValues);
    baseSnapshotRef.current = nextSnapshot;
    pendingExternalValuesRef.current = null;
    pendingExternalSnapshotRef.current = '';
    dirtyRef.current = false;
    setIsDirty(false);
    setHasExternalUpdate(false);
    setValuesState(nextValues);
  }, []);

  const setValues: Dispatch<SetStateAction<TValues>> = useCallback((nextValue) => {
    setValuesState((current) => {
      const nextValues = typeof nextValue === 'function' ? (nextValue as (previous: TValues) => TValues)(current) : nextValue;
      const nextSnapshot = serializeFormValues(nextValues);
      const nextIsDirty = nextSnapshot !== baseSnapshotRef.current;
      dirtyRef.current = nextIsDirty;
      setIsDirty(nextIsDirty);
      return nextValues;
    });
  }, []);

  useEffect(() => {
    const nextSnapshot = serializeFormValues(initialValues);

    if (recordKeyRef.current !== recordKey) {
      recordKeyRef.current = recordKey;
      setCleanValues(initialValues);
      return;
    }

    if (!dirtyRef.current) {
      setCleanValues(initialValues);
      return;
    }

    if (nextSnapshot !== baseSnapshotRef.current && nextSnapshot !== pendingExternalSnapshotRef.current) {
      pendingExternalValuesRef.current = initialValues;
      pendingExternalSnapshotRef.current = nextSnapshot;
      setHasExternalUpdate(true);
    }
  }, [initialValues, recordKey, recordUpdatedAt, setCleanValues]);

  const markSaved = useCallback((savedValues?: TValues) => {
    setCleanValues(savedValues ?? values);
  }, [setCleanValues, values]);

  const discardChanges = useCallback(() => {
    const nextValues = pendingExternalValuesRef.current ?? initialValues;
    setCleanValues(nextValues);
  }, [initialValues, setCleanValues]);

  const acceptExternalUpdate = useCallback(() => {
    if (!pendingExternalValuesRef.current) return;
    setCleanValues(pendingExternalValuesRef.current);
  }, [setCleanValues]);

  const dismissExternalUpdate = useCallback(() => {
    pendingExternalValuesRef.current = null;
    pendingExternalSnapshotRef.current = '';
    setHasExternalUpdate(false);
  }, []);

  return {
    values,
    setValues,
    isDirty,
    hasExternalUpdate,
    markSaved,
    discardChanges,
    acceptExternalUpdate,
    dismissExternalUpdate
  };
}
