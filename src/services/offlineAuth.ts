import type { ProfileStatus } from '../hooks/authContext';
import type { Session } from '@supabase/supabase-js';

const key = 'medical-study:last-profile-validation';

type StoredValidation = {
  user_id: string;
  status: ProfileStatus;
  validated_at: string;
};

export function saveProfileValidation(userId: string, status: ProfileStatus) {
  localStorage.setItem(
    key,
    JSON.stringify({
      user_id: userId,
      status,
      validated_at: new Date().toISOString()
    } satisfies StoredValidation)
  );
}

export function getProfileValidation(userId: string) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredValidation;
    return parsed.user_id === userId ? parsed : null;
  } catch {
    return null;
  }
}

export function clearProfileValidation() {
  localStorage.removeItem(key);
}

export function getPersistedSupabaseSession(): Session | null {
  try {
    for (let index = 0; index < localStorage.length; index += 1) {
      const storageKey = localStorage.key(index);
      if (!storageKey?.startsWith('sb-') || !storageKey.endsWith('-auth-token')) continue;
      const parsed = JSON.parse(localStorage.getItem(storageKey) ?? 'null') as { currentSession?: Session } | Session | null;
      if (parsed && 'currentSession' in parsed && parsed.currentSession?.user?.id) {
        return parsed.currentSession;
      }
      if (parsed && 'user' in parsed && parsed.user?.id) {
        return parsed as Session;
      }
    }
  } catch {
    return null;
  }

  return null;
}
