import * as Dialog from '@radix-ui/react-dialog';
import { useForm } from 'react-hook-form';
import { X } from 'lucide-react';
import { useEffect } from 'react';
import styles from './DriverModal.module.css';

export default function DriverModal({ open, onOpenChange, driver, onSubmit, isSubmitting }) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      name: '',
      license_number: '',
      license_expiry: '',
      phone: '',
      is_active: true
    }
  });

  useEffect(() => {
    if (driver) {
      reset(driver);
    } else {
      reset({
        name: '',
        license_number: '',
        license_expiry: '',
        phone: '',
        is_active: true
      });
    }
  }, [driver, reset, open]);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className={styles.overlay} />
        <Dialog.Content className={styles.content}>
          <Dialog.Title className={styles.title}>
            {driver ? 'Editar Conductor' : 'Registrar Nuevo Conductor'}
          </Dialog.Title>
          <Dialog.Description className={styles.description}>
            Ingresa los datos del conductor. Los campos con * son obligatorios.
          </Dialog.Description>

          <form onSubmit={handleSubmit(onSubmit)}>
            <div className={styles.formGrid}>
              
              <div className={`${styles.field} ${styles.full}`}>
                <label className={styles.label}>Nombre Completo *</label>
                <input 
                  className={styles.input} 
                  {...register('name', { required: 'El nombre es obligatorio' })} 
                  placeholder="Ej: Juan Pérez"
                />
                {errors.name && <span className={styles.errorText}>{errors.name.message}</span>}
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Número de Licencia</label>
                <input 
                  className={styles.input} 
                  {...register('license_number')} 
                  placeholder="Ej: 12345678-9"
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Vencimiento de Licencia</label>
                <input 
                  type="date"
                  className={styles.input} 
                  {...register('license_expiry')} 
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Teléfono</label>
                <input 
                  type="tel"
                  className={styles.input} 
                  {...register('phone')} 
                  placeholder="Ej: +569 1234 5678"
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Estado</label>
                <select className={styles.select} {...register('is_active')}>
                  <option value={true}>Activo</option>
                  <option value={false}>Inactivo</option>
                </select>
              </div>

            </div>

            <div className={styles.actions}>
              <Dialog.Close asChild>
                <button type="button" className={styles.btnCancel}>Cancelar</button>
              </Dialog.Close>
              <button type="submit" className={styles.btnSubmit} disabled={isSubmitting}>
                {isSubmitting ? 'Guardando...' : 'Guardar Conductor'}
              </button>
            </div>
          </form>

          <Dialog.Close asChild>
            <button className={styles.closeButton} aria-label="Close">
              <X size={20} />
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
