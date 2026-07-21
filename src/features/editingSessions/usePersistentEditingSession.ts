import { useCallback, useEffect, useMemo, useRef, type Dispatch, type SetStateAction } from 'react';
import { useLocation } from 'react-router-dom';
import type { EditingSessionEntityType } from '../../types/editingSession';
import {
  buildEditingSessionKey,
  deleteEditingSession,
  getEditingSession,
  saveEditingSession
} from './editingSessionRepository';

type UsePersistentEditingSessionOptions<TFormData> = {
  enabled: boolean;
  userId?: string;
  entityType: EditingSessionEntityType;
  entityId?: string | null;
  draftId?: string | null;
  values: TFormData;
  setValues: Dispatch<SetStateAction<TFormData>>;
  isDirty: boolean;
  baseRecordUpdatedAt?: string | null;
  route: string;
};

const autosaveDelayMs = 850;

export function usePersistentEditingSession<TFormData>({
  enabled,
  userId,
  entityType,
  entityId,
  draftId,
  values,
  setValues,
  isDirty,
  baseRecordUpdatedAt,
  route
}: UsePersistentEditingSessionOptions<TFormData>) {
  const location = useLocation();
  const latestValuesRef = useRef(values);
  const isDirtyRef = useRef(isDirty);
  const restoredRef = useRef(false);
  const timerRef = useRef<number | null>(null);
  const scrollRestoreRef = useRef<number | null>(null);

  const sessionKey = useMemo(() => {
    if (!userId) return '';
    return buildEditingSessionKey({ userId, entityType, entityId, draftId });
  }, [draftId, entityId, entityType, userId]);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const persistNow = useCallback(async () => {
    if (!enabled || !userId || !sessionKey || !isDirtyRef.current) return;
    await saveEditingSession({
      userId,
      entityType,
      entityId,
      draftId,
      route,
      formData: latestValuesRef.current,
      scrollY: window.scrollY,
      baseRecordUpdatedAt
    });
  }, [baseRecordUpdatedAt, draftId, enabled, entityId, entityType, route, sessionKey, userId]);

  useEffect(() => {
    latestValuesRef.current = values;
  }, [values]);

  useEffect(() => {
    isDirtyRef.current = isDirty;
  }, [isDirty]);

  useEffect(() => {
    restoredRef.current = false;
    scrollRestoreRef.current = null;
  }, [sessionKey]);

  useEffect(() => {
    if (!enabled || !sessionKey || restoredRef.current) return;
    restoredRef.current = true;

    getEditingSession<TFormData>(sessionKey)
      .then((session) => {
        if (!session) return;
        setValues(session.form_data);
        scrollRestoreRef.current = session.scroll_y;
        window.requestAnimationFrame(() => {
          if (scrollRestoreRef.current !== null) {
            window.scrollTo({ top: scrollRestoreRef.current });
          }
        });
      })
      .catch(() => undefined);
  }, [enabled, sessionKey, setValues]);

  useEffect(() => {
    if (!enabled || !isDirty || !sessionKey) return;
    clearTimer();
    timerRef.current = window.setTimeout(() => {
      persistNow().catch(() => undefined);
    }, autosaveDelayMs);
    return clearTimer;
  }, [clearTimer, enabled, isDirty, persistNow, sessionKey, values]);

  useEffect(() => {
    const persistIfNeeded = () => {
      persistNow().catch(() => undefined);
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') persistIfNeeded();
    };
    const handlePageHide = () => persistIfNeeded();

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handlePageHide);
    window.addEventListener('beforeunload', handlePageHide);
    window.addEventListener('blur', handlePageHide);

    return () => {
      persistIfNeeded();
      clearTimer();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handlePageHide);
      window.removeEventListener('beforeunload', handlePageHide);
      window.removeEventListener('blur', handlePageHide);
    };
  }, [clearTimer, persistNow]);

  const clearSession = useCallback(async () => {
    clearTimer();
    if (sessionKey) await deleteEditingSession(sessionKey);
  }, [clearTimer, sessionKey]);

  return {
    clearSession,
    currentRoute: `${location.pathname}${location.search}`
  };
}
