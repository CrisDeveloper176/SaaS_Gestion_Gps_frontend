import * as Dialog from '@radix-ui/react-dialog';
import { useForm } from 'react-hook-form';
import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getVehicles } from '../api/axios';
import styles from './DriverModal.module.css';

export default function AssignDriverModal({ open, onOpenChange, driver, onSubmit, isSubmitting }) {
  const [vehicles, setVehicles] = useState([]);
  const [loadingVehicles, setLoadingVehicles] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: { vehicle_id: '' }
  });

  useEffect(() => {
    if (open) {
      reset({ vehicle_id: '' });
      setLoadingVehicles(true);
      getVehicles({ status: 'active' })
        .then(res => setVehicles(res.data.results || []))
        .catch(err => console.error("Error fetching vehicles:", err))
        .finally(() => setLoadingVehicles(false));
    }
  }, [open, reset]);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className={styles.overlay} />
        <Dialog.Content className={styles.content}>
          <Dialog.Title className={styles.title}>
            Asignar Vehículo a {driver?.name}
          </Dialog.Title>
          <Dialog.Description className={styles.description}>
            Selecciona el vehículo que este conductor operará actualmente.
          </Dialog.Description>

          <form onSubmit={handleSubmit(onSubmit)}>
            <div className={styles.field} style={{ marginBottom: 24 }}>
              <label className={styles.label}>Vehículo Disponible *</label>
              <select 
                className={styles.select} 
                {...register('vehicle_id', { required: 'Debes seleccionar un vehículo' })}
                disabled={loadingVehicles}
              >
                <option value="">-- Seleccionar Vehículo --</option>
                {vehicles.map(v => (
                  <option key={v.id} value={v.id}>
                    {v.plate} {v.alias ? `- ${v.alias}` : ''}
                  </option>
                ))}
              </select>
              {errors.vehicle_id && <span className={styles.errorText}>{errors.vehicle_id.message}</span>}
              {loadingVehicles && <span style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Cargando vehículos...</span>}
            </div>

            <div className={styles.actions}>
              <Dialog.Close asChild>
                <button type="button" className={styles.btnCancel}>Cancelar</button>
              </Dialog.Close>
              <button type="submit" className={styles.btnSubmit} disabled={isSubmitting || loadingVehicles}>
                {isSubmitting ? 'Asignando...' : 'Asignar Conductor'}
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
