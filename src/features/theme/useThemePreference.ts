import { useEffect, useState } from 'react';
import {
  applyThemePreference,
  getEffectiveTheme,
  getThemePreference,
  setThemePreference,
  type EffectiveTheme,
  type ThemePreference
} from './theme';

type ThemeState = {
  effectiveTheme: EffectiveTheme;
  preference: ThemePreference;
};

function readThemeState(): ThemeState {
  const preference = getThemePreference();
  return { preference, effectiveTheme: getEffectiveTheme(preference) };
}

export function useThemePreference() {
  const [state, setState] = useState<ThemeState>(() => readThemeState());

  useEffect(() => {
    const syncThemeState = () => setState(readThemeState());
    window.addEventListener('askleion-theme-change', syncThemeState);
    return () => window.removeEventListener('askleion-theme-change', syncThemeState);
  }, []);

  const updatePreference = (preference: ThemePreference) => {
    setThemePreference(preference);
    setState({ preference, effectiveTheme: applyThemePreference(preference) });
  };

  return { ...state, setThemePreference: updatePreference };
}
