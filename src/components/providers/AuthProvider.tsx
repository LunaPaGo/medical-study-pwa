import { useEffect, useMemo, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { AuthContext, type AuthContextValue, type AuthMode, type ProfileStatus } from '../../hooks/authContext';
import { checkSupabaseConnectivity, withTimeout } from '../../services/connectivity';
import { localDbPromise } from '../../storage/localDb';
import { clearProfileValidation, getPersistedSupabaseSession, getProfileValidation, saveProfileValidation } from '../../services/offlineAuth';
import { supabase } from '../../services/supabase';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profileStatus, setProfileStatus] = useState<ProfileStatus | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<AuthMode>('online');
  const [isLoading, setIsLoading] = useState(true);
  const [bootStep, setBootStep] = useState('Iniciando aplicación...');

  useEffect(() => {
    let isActive = true;
    let lastSession: Session | null = null;

    function updateBootStep(step: string) {
      console.info(step);
      setBootStep(step);
    }

    function enterOfflineReadOnly(nextSession: Session) {
      updateBootStep('OFFLINE_READ_ONLY_ENTERED');
      setSession(nextSession);
      setProfileStatus('approved');
      setProfileError(null);
      setAuthMode('offline-readonly');
      setIsLoading(false);
      console.info('APP_BOOT_COMPLETED');
    }

    async function hasLocalDataForUser(userId: string) {
      try {
        const db = await withTimeout(localDbPromise, 3000, 'LOCAL_DATABASE_READY');
        const [topics, medications, folders, categories, tags, attachments] = await Promise.all([
          db.getAllFromIndex('topics', 'user_id', userId),
          db.getAllFromIndex('medications', 'user_id', userId),
          db.getAllFromIndex('folders', 'user_id', userId),
          db.getAllFromIndex('categories', 'user_id', userId),
          db.getAllFromIndex('tags', 'user_id', userId),
          db.getAllFromIndex('attachments', 'user_id', userId)
        ]);

        return topics.length + medications.length + folders.length + categories.length + tags.length + attachments.length > 0;
      } catch (error) {
        console.error('APP_BOOT_ERROR', error);
        return false;
      }
    }

    async function validateRemoteSession(nextSession: Session, allowOfflineFallback: boolean) {
      if (!isActive) {
        return;
      }

      lastSession = nextSession;
      setSession(nextSession);
      setProfileError(null);
      setAuthMode('online');

      updateBootStep('REMOTE_PROFILE_VALIDATION_STARTED');
      let response;
      try {
        response = await withTimeout(
          Promise.resolve(supabase.from('profiles').select('status').eq('user_id', nextSession.user.id).maybeSingle()),
          4500,
          'PROFILE_VALIDATION'
        );
      } catch (error) {
        console.error('APP_BOOT_ERROR', error);
        const stored = getProfileValidation(nextSession.user.id);
        if (allowOfflineFallback && stored?.status === 'approved' && (await hasLocalDataForUser(nextSession.user.id))) {
          enterOfflineReadOnly(nextSession);
          return;
        }

        setProfileStatus(null);
        setProfileError('No pudimos comprobar el estado de aprobación de tu cuenta.');
        setIsLoading(false);
        return;
      }

      const { data, error } = response;

      if (!isActive) {
        return;
      }

      if (error) {
        console.error('No se pudo consultar el perfil del usuario.', error);
        const stored = getProfileValidation(nextSession.user.id);
        const looksLikeNetworkError = error.message.toLowerCase().includes('fetch') || error.message.toLowerCase().includes('network');
        if (allowOfflineFallback && looksLikeNetworkError && stored?.status === 'approved' && (await hasLocalDataForUser(nextSession.user.id))) {
          enterOfflineReadOnly(nextSession);
          return;
        }

        setProfileStatus(null);
        setProfileError('No pudimos comprobar el estado de aprobación de tu cuenta.');
        setIsLoading(false);
        console.info('APP_BOOT_ERROR', error.message);
        return;
      }

      if (!data) {
        console.error('No existe un perfil asociado a la sesión actual.', {
          userId: nextSession.user.id
        });
        setProfileStatus(null);
        setProfileError('No encontramos un perfil asociado a esta cuenta.');
        setIsLoading(false);
        console.info('APP_BOOT_ERROR', 'PROFILE_MISSING');
        return;
      }

      setProfileStatus(data.status);
      saveProfileValidation(nextSession.user.id, data.status);
      updateBootStep(data.status === 'approved' ? 'LOCAL_APPROVAL_APPROVED' : 'LOCAL_APPROVAL_NOT_APPROVED');
      setIsLoading(false);
      console.info('APP_BOOT_COMPLETED');
    }

    async function applySession(nextSession: Session | null) {
      if (!isActive) return;
      setIsLoading(true);
      setProfileError(null);

      if (!nextSession) {
        console.info('LOCAL_SESSION_MISSING');
        setSession(null);
        setProfileStatus(null);
        setAuthMode('online');
        setProfileError(navigator.onLine ? null : 'Necesitás conexión a Internet para iniciar sesión y validar tu cuenta.');
        setIsLoading(false);
        console.info('APP_BOOT_COMPLETED');
        return;
      }

      console.info('LOCAL_SESSION_FOUND');
      lastSession = nextSession;
      setSession(nextSession);

      updateBootStep('LOCAL_DATABASE_READY_CHECK');
      await withTimeout(localDbPromise, 3000, 'LOCAL_DATABASE_READY').catch((error) => {
        console.error('APP_BOOT_ERROR', error);
      });
      console.info('LOCAL_DATABASE_READY');

      const stored = getProfileValidation(nextSession.user.id);
      if (stored?.status === 'approved') {
        console.info('LOCAL_APPROVAL_APPROVED');
      } else {
        console.info('LOCAL_APPROVAL_MISSING_OR_NOT_APPROVED');
      }

      const network = await checkSupabaseConnectivity();
      if (network === 'offline') {
        console.info('REMOTE_SESSION_SKIPPED_OFFLINE');
        if (stored?.status === 'approved' && (await hasLocalDataForUser(nextSession.user.id))) {
          enterOfflineReadOnly(nextSession);
          return;
        }

        setProfileStatus(null);
        setAuthMode('online');
        setProfileError('Necesitás conexión a Internet para iniciar sesión y validar tu cuenta.');
        setIsLoading(false);
        console.info('APP_BOOT_COMPLETED');
        return;
      }

      await validateRemoteSession(nextSession, true);
    }

    async function bootstrap() {
      updateBootStep('APP_BOOT_START');
      const persisted = getPersistedSupabaseSession();
      if (persisted) {
        console.info('LOCAL_SESSION_FOUND');
        void applySession(persisted);
      } else {
        console.info('LOCAL_SESSION_MISSING');
      }

      try {
        const { data } = await withTimeout(supabase.auth.getSession(), 2500, 'GET_LOCAL_SESSION');
        void applySession(data.session);
      } catch (error) {
        console.error('APP_BOOT_ERROR', error);
        if (persisted) {
          void applySession(persisted);
        } else {
          setProfileError(navigator.onLine ? 'No pudimos leer la sesión local.' : 'Necesitás conexión a Internet para iniciar sesión y validar tu cuenta.');
          setIsLoading(false);
        }
      }
    }

    void bootstrap();

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      void applySession(nextSession);
    });

    const handleOnline = () => {
      if (lastSession) {
        setIsLoading(true);
        void validateRemoteSession(lastSession, false);
      }
    };

    const handleOffline = () => {
      if (lastSession) {
        void applySession(lastSession);
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      isActive = false;
      subscription.unsubscribe();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      profileStatus,
      profileError,
      authMode,
      isReadOnly: authMode === 'offline-readonly',
      isLoading,
      bootStep,
      signOut: async () => {
        setSession(null);
        setProfileStatus(null);
        setProfileError(null);
        setAuthMode('online');
        setIsLoading(false);
        clearProfileValidation();
        await supabase.auth.signOut();
      }
    }),
    [authMode, bootStep, isLoading, profileError, profileStatus, session]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
