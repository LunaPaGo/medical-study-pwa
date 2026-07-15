import { useEffect, useMemo, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { AuthContext, type AuthContextValue, type ProfileStatus } from '../../hooks/authContext';
import { supabase } from '../../services/supabase';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profileStatus, setProfileStatus] = useState<ProfileStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isActive = true;

    async function applySession(nextSession: Session | null) {
      if (!isActive) {
        return;
      }

      setIsLoading(true);
      setSession(nextSession);

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

      setProfileStatus(!error && data?.status === 'approved' ? 'approved' : 'pending');
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
      isLoading,
      signOut: async () => {
        await supabase.auth.signOut();
      }
    }),
    [isLoading, profileStatus, session]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
