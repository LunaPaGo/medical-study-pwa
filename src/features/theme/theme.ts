export type ThemePreference = 'light' | 'dark' | 'system';
export type EffectiveTheme = 'light' | 'dark';

export const themeStorageKey = 'askleion-theme';

const systemDarkQuery = '(prefers-color-scheme: dark)';
let isInitialized = false;

export function isThemePreference(value: unknown): value is ThemePreference {
  return value === 'light' || value === 'dark' || value === 'system';
}

export function getThemePreference(): ThemePreference {
  const stored = localStorage.getItem(themeStorageKey);
  return isThemePreference(stored) ? stored : 'system';
}

export function getEffectiveTheme(preference: ThemePreference = getThemePreference()): EffectiveTheme {
  if (preference === 'light' || preference === 'dark') return preference;
  return window.matchMedia(systemDarkQuery).matches ? 'dark' : 'light';
}

export function applyThemePreference(preference: ThemePreference = getThemePreference()) {
  const effectiveTheme = getEffectiveTheme(preference);
  document.documentElement.dataset.theme = effectiveTheme;
  document.documentElement.style.colorScheme = effectiveTheme;
  return effectiveTheme;
}

export function setThemePreference(preference: ThemePreference) {
  localStorage.setItem(themeStorageKey, preference);
  const effectiveTheme = applyThemePreference(preference);
  window.dispatchEvent(new CustomEvent('askleion-theme-change', { detail: { preference, effectiveTheme } }));
}

export function initializeThemePreference() {
  applyThemePreference();

  if (isInitialized) return;
  isInitialized = true;

  window.matchMedia(systemDarkQuery).addEventListener('change', () => {
    if (getThemePreference() === 'system') {
      const effectiveTheme = applyThemePreference('system');
      window.dispatchEvent(new CustomEvent('askleion-theme-change', { detail: { preference: 'system', effectiveTheme } }));
    }
  });

  window.addEventListener('storage', (event) => {
    if (event.key === themeStorageKey) {
      const preference = isThemePreference(event.newValue) ? event.newValue : 'system';
      const effectiveTheme = applyThemePreference(preference);
      window.dispatchEvent(new CustomEvent('askleion-theme-change', { detail: { preference, effectiveTheme } }));
    }
  });
}
