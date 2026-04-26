import * as Dialog from '@radix-ui/react-dialog';
import { AlertTriangle, X } from 'lucide-react';
import styles from './VehicleModal.module.css';

/**
 * Reusable confirmation dialog — replaces window.confirm() across the app.
 * Matches the glassmorphism design system and supports danger/neutral variants.
 *
 * Usage:
 *   <ConfirmModal
 *     open={confirmOpen}
 *     onOpenChange={setConfirmOpen}
 *     title="Eliminar Vehículo"
 *     message="Esta acción no se puede deshacer. ¿Continuar?"
 *     confirmLabel="Eliminar"
 *     onConfirm={handleDelete}
 *   />
 */
export default function ConfirmModal({
  open,
  onOpenChange,
  title,
  message,
  confirmLabel = 'Confirmar',
  onConfirm,
  isDanger = true,
}) {
  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className={styles.overlay} />
        <Dialog.Content className={styles.content} style={{ maxWidth: 420 }}>
          <Dialog.Title className={styles.title} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {isDanger && <AlertTriangle size={20} color="var(--danger)" />}
            {title}
          </Dialog.Title>
          <Dialog.Description className={styles.description}>
            {message}
          </Dialog.Description>

          <div className={styles.actions}>
            <Dialog.Close asChild>
              <button type="button" className={styles.btnCancel}>Cancelar</button>
            </Dialog.Close>
            <button
              type="button"
              onClick={handleConfirm}
              style={{
                background: isDanger
                  ? 'linear-gradient(135deg, var(--danger), #f87171)'
                  : 'linear-gradient(135deg, var(--accent-primary), #818cf8)',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                padding: '8px 20px',
                fontFamily: 'Outfit, sans-serif',
                fontWeight: 600,
                fontSize: 14,
                cursor: 'pointer',
                transition: 'var(--transition)',
              }}
            >
              {confirmLabel}
            </button>
          </div>

          <Dialog.Close asChild>
            <button className={styles.closeButton} aria-label="Cerrar">
              <X size={20} />
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
