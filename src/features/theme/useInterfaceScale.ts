import { useEffect, useState } from 'react';
import {
  getInterfaceScale,
  interfaceScaleValues,
  setInterfaceScale,
  type InterfaceScale
} from './interfaceScale';

export function useInterfaceScale() {
  const [scale, setScale] = useState<InterfaceScale>(() => getInterfaceScale());

  useEffect(() => {
    const syncScale = () => setScale(getInterfaceScale());
    window.addEventListener('askleion-interface-scale-change', syncScale);
    return () => window.removeEventListener('askleion-interface-scale-change', syncScale);
  }, []);

  const scaleIndex = interfaceScaleValues.indexOf(scale);
  const canDecrease = scaleIndex > 0;
  const canIncrease = scaleIndex < interfaceScaleValues.length - 1;

  const updateScale = (nextScale: InterfaceScale) => {
    setInterfaceScale(nextScale);
    setScale(nextScale);
  };

  const decreaseScale = () => {
    if (canDecrease) updateScale(interfaceScaleValues[scaleIndex - 1]);
  };

  const increaseScale = () => {
    if (canIncrease) updateScale(interfaceScaleValues[scaleIndex + 1]);
  };

  return { scale, canDecrease, canIncrease, decreaseScale, increaseScale };
}
