import * as Dialog from '@radix-ui/react-dialog';
import { useForm } from 'react-hook-form';
import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getDrivers } from '../api/axios';
import styles from './DriverModal.module.css';

export default function AssignDriverToVehicleModal({ open, onOpenChange, vehicle, onSubmit, isSubmitting }) {
  const [drivers, setDrivers] = useState([]);
  const [loadingDrivers, setLoadingDrivers] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: { driver_id: '' }
  });

  useEffect(() => {
    if (open) {
      reset({ driver_id: '' });
      setLoadingDrivers(true);
      // Fetch active drivers
      getDrivers({ search: '' }) // Optionally add a status filter if the API supports it
        .then(res => {
          const activeDrivers = (res.data.results || []).filter(d => d.is_active && !d.is_assigned);
          setDrivers(activeDrivers);
        })
        .catch(err => console.error("Error fetching drivers:", err))
        .finally(() => setLoadingDrivers(false));
    }
  }, [open, reset]);

  const onFormSubmit = (data) => {
    // We pass both driver_id and vehicle_id to the submit handler
    onSubmit(data.driver_id, vehicle.id);
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className={styles.overlay} />
        <Dialog.Content className={styles.content}>
          <Dialog.Title className={styles.title}>
            Asignar Conductor al Vehículo {vehicle?.plate}
          </Dialog.Title>
          <Dialog.Description className={styles.description}>
            Selecciona el conductor que operará este vehículo actualmente.
          </Dialog.Description>

          <form onSubmit={handleSubmit(onFormSubmit)}>
            <div className={styles.field} style={{ marginBottom: 24 }}>
              <label className={styles.label}>Conductor Disponible *</label>
              <select 
                className={styles.select} 
                {...register('driver_id', { required: 'Debes seleccionar un conductor' })}
                disabled={loadingDrivers}
              >
                <option value="">-- Seleccionar Conductor --</option>
                {drivers.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.name} {d.license_number ? `(Licencia: ${d.license_number})` : ''}
                  </option>
                ))}
              </select>
              {errors.driver_id && <span className={styles.errorText}>{errors.driver_id.message}</span>}
              {loadingDrivers && <span style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Cargando conductores...</span>}
            </div>

            <div className={styles.actions}>
              <Dialog.Close asChild>
                <button type="button" className={styles.btnCancel}>Cancelar</button>
              </Dialog.Close>
              <button type="submit" className={styles.btnSubmit} disabled={isSubmitting || loadingDrivers}>
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
