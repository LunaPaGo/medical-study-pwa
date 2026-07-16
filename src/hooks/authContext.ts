import { createContext } from 'react';
import type { Session, User } from '@supabase/supabase-js';

export type ProfileStatus = 'pending' | 'approved';

export type AuthContextValue = {
  session: Session | null;
  user: User | null;
  profileStatus: ProfileStatus | null;
  profileError: string | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);
