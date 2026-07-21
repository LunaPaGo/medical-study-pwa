type Props = {
  onAccept: () => void;
  onDismiss: () => void;
};

export function ExternalUpdateNotice({ onAccept, onDismiss }: Props) {
  return (
    <div className="notice warning external-update-notice">
      <span>Hay una versión más reciente disponible. Tus cambios actuales se mantienen intactos.</span>
      <div className="external-update-actions">
        <button className="ghost-button" type="button" onClick={onDismiss}>
          Mantener mis cambios
        </button>
        <button className="primary-button" type="button" onClick={onAccept}>
          Cargar versión nueva
        </button>
      </div>
    </div>
  );
}
