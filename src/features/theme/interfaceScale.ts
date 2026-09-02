export const interfaceScaleValues = [70, 80, 90, 100, 110, 120] as const;

export type InterfaceScale = (typeof interfaceScaleValues)[number];

export const interfaceScaleStorageKey = 'askleion-interface-scale';

export function isInterfaceScale(value: unknown): value is InterfaceScale {
  const numericValue = typeof value === 'string' ? Number(value) : value;
  return interfaceScaleValues.some((scale) => scale === numericValue);
}

export function getInterfaceScale(): InterfaceScale {
  const stored = localStorage.getItem(interfaceScaleStorageKey);
  return isInterfaceScale(stored) ? Number(stored) as InterfaceScale : 100;
}

export function applyInterfaceScale(scale: InterfaceScale = getInterfaceScale()) {
  document.documentElement.dataset.interfaceScale = String(scale);
  return scale;
}

export function setInterfaceScale(scale: InterfaceScale) {
  localStorage.setItem(interfaceScaleStorageKey, String(scale));
  applyInterfaceScale(scale);
  window.dispatchEvent(new CustomEvent('askleion-interface-scale-change', { detail: { scale } }));
}

export function initializeInterfaceScale() {
  applyInterfaceScale();

  window.addEventListener('storage', (event) => {
    if (event.key === interfaceScaleStorageKey) {
      const scale = isInterfaceScale(event.newValue) ? Number(event.newValue) as InterfaceScale : 100;
      applyInterfaceScale(scale);
      window.dispatchEvent(new CustomEvent('askleion-interface-scale-change', { detail: { scale } }));
    }
  });
}
