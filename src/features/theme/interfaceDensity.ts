export type InterfaceDensity = 'compact' | 'normal';

export const interfaceDensityStorageKey = 'askleion-interface-density';

export function isInterfaceDensity(value: unknown): value is InterfaceDensity {
  return value === 'compact' || value === 'normal';
}

export function getInterfaceDensity(): InterfaceDensity {
  const stored = localStorage.getItem(interfaceDensityStorageKey);
  return isInterfaceDensity(stored) ? stored : 'normal';
}

export function applyInterfaceDensity(density: InterfaceDensity = getInterfaceDensity()) {
  document.documentElement.dataset.density = density;
  return density;
}

export function setInterfaceDensity(density: InterfaceDensity) {
  localStorage.setItem(interfaceDensityStorageKey, density);
  applyInterfaceDensity(density);
  window.dispatchEvent(new CustomEvent('askleion-density-change', { detail: { density } }));
}

export function initializeInterfaceDensity() {
  applyInterfaceDensity();

  window.addEventListener('storage', (event) => {
    if (event.key === interfaceDensityStorageKey) {
      const density = isInterfaceDensity(event.newValue) ? event.newValue : 'normal';
      applyInterfaceDensity(density);
      window.dispatchEvent(new CustomEvent('askleion-density-change', { detail: { density } }));
    }
  });
}
