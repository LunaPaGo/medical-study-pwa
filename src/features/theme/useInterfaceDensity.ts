import { useEffect, useState } from 'react';
import {
  applyInterfaceDensity,
  getInterfaceDensity,
  setInterfaceDensity,
  type InterfaceDensity
} from './interfaceDensity';

export function useInterfaceDensity() {
  const [density, setDensity] = useState<InterfaceDensity>(() => getInterfaceDensity());

  useEffect(() => {
    const syncDensity = () => setDensity(getInterfaceDensity());
    window.addEventListener('askleion-density-change', syncDensity);
    return () => window.removeEventListener('askleion-density-change', syncDensity);
  }, []);

  const updateDensity = (nextDensity: InterfaceDensity) => {
    setInterfaceDensity(nextDensity);
    setDensity(applyInterfaceDensity(nextDensity));
  };

  return { density, setInterfaceDensity: updateDensity };
}
