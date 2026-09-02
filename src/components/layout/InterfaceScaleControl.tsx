import { Minus, Plus } from 'lucide-react';
import { useInterfaceScale } from '../../features/theme/useInterfaceScale';

export function InterfaceScaleControl() {
  const { scale, canDecrease, canIncrease, decreaseScale, increaseScale } = useInterfaceScale();

  return (
    <div className="interface-scale-control" role="group" aria-label="Escala de interfaz">
      <button
        type="button"
        onClick={decreaseScale}
        disabled={!canDecrease}
        aria-label="Reducir escala de interfaz"
        title="Reducir escala"
      >
        <Minus size={17} aria-hidden="true" />
      </button>
      <output aria-live="polite" aria-label={`Escala de interfaz: ${scale}%`}>
        {scale}%
      </output>
      <button
        type="button"
        onClick={increaseScale}
        disabled={!canIncrease}
        aria-label="Aumentar escala de interfaz"
        title="Aumentar escala"
      >
        <Plus size={17} aria-hidden="true" />
      </button>
    </div>
  );
}
