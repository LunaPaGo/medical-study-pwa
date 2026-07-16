import { useEffect, useMemo, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { AuthContext, type AuthContextValue, type ProfileStatus } from '../../hooks/authContext';
import { supabase } from '../../services/supabase';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profileStatus, setProfileStatus] = useState<ProfileStatus | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isActive = true;

    async function applySession(nextSession: Session | null) {
      if (!isActive) {
        return;
      }

      setIsLoading(true);
      setSession(nextSession);
      setProfileError(null);

      if (!nextSession) {
        setProfileStatus(null);
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('status')
        .eq('user_id', nextSession.user.id)
        .maybeSingle();

      if (!isActive) {
        return;
      }

      if (error) {
        console.error('No se pudo consultar el perfil del usuario.', error);
        setProfileStatus(null);
        setProfileError('No pudimos comprobar el estado de aprobación de tu cuenta.');
        setIsLoading(false);
        return;
      }

      if (!data) {
        console.error('No existe un perfil asociado a la sesión actual.', {
          userId: nextSession.user.id
        });
        setProfileStatus(null);
        setProfileError('No encontramos un perfil asociado a esta cuenta.');
        setIsLoading(false);
        return;
      }

      setProfileStatus(data.status);
      setIsLoading(false);
    }

    supabase.auth.getSession().then(({ data }) => {
      void applySession(data.session);
    });

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      void applySession(nextSession);
    });

    return () => {
      isActive = false;
      subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      profileStatus,
      profileError,
      isLoading,
      signOut: async () => {
        setSession(null);
        setProfileStatus(null);
        setProfileError(null);
        setIsLoading(false);
        await supabase.auth.signOut();
      }
    }),
    [isLoading, profileError, profileStatus, session]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
