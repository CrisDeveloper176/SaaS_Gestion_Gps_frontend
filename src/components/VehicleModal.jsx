import * as Dialog from '@radix-ui/react-dialog';
import { useForm as useHookForm } from 'react-hook-form';
import { X } from 'lucide-react';
import { useEffect } from 'react';
import styles from './VehicleModal.module.css';

export default function VehicleModal({ open, onOpenChange, vehicle, onSubmit, isSubmitting }) {
  const { register, handleSubmit, reset, formState: { errors } } = useHookForm({
    defaultValues: {
      plate: '',
      alias: '',
      brand: '',
      model: '',
      year: new Date().getFullYear(),
      fuel_type: 'gasoline',
      odometer_base: 0,
      device_id: '',
      status: 'active'
    }
  });

  useEffect(() => {
    if (vehicle) {
      reset(vehicle);
    } else {
      reset({
        plate: '',
        alias: '',
        brand: '',
        model: '',
        year: new Date().getFullYear(),
        fuel_type: 'gasoline',
        odometer_base: 0,
        device_id: '',
        status: 'active'
      });
    }
  }, [vehicle, reset, open]);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className={styles.overlay} />
        <Dialog.Content className={styles.content}>
          <Dialog.Title className={styles.title}>
            {vehicle ? 'Editar Vehículo' : 'Registrar Nuevo Vehículo'}
          </Dialog.Title>
          <Dialog.Description className={styles.description}>
            Ingresa los datos del vehículo para tu flota. Los campos con * son obligatorios.
          </Dialog.Description>

          <form onSubmit={handleSubmit(onSubmit)}>
            <div className={styles.formGrid}>
              
              <div className={styles.field}>
                <label className={styles.label}>Patente *</label>
                <input 
                  className={styles.input} 
                  {...register('plate', { required: 'La patente es obligatoria' })} 
                  placeholder="Ej: AB1234"
                />
                {errors.plate && <span className={styles.errorText}>{errors.plate.message}</span>}
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Alias</label>
                <input 
                  className={styles.input} 
                  {...register('alias')} 
                  placeholder="Ej: Camión Reparto 1"
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Marca *</label>
                <input 
                  className={styles.input} 
                  {...register('brand', { required: 'La marca es obligatoria' })} 
                  placeholder="Ej: Mercedes Benz"
                />
                {errors.brand && <span className={styles.errorText}>{errors.brand.message}</span>}
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Modelo *</label>
                <input 
                  className={styles.input} 
                  {...register('model', { required: 'El modelo es obligatorio' })} 
                  placeholder="Ej: Sprinter"
                />
                {errors.model && <span className={styles.errorText}>{errors.model.message}</span>}
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Año *</label>
                <input 
                  type="number"
                  className={styles.input} 
                  {...register('year', { required: 'Obligatorio', valueAsNumber: true })} 
                />
                {errors.year && <span className={styles.errorText}>{errors.year.message}</span>}
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Tipo de Combustible</label>
                <select className={styles.select} {...register('fuel_type')}>
                  <option value="gasoline">Gasolina</option>
                  <option value="diesel">Diesel</option>
                  <option value="electric">Eléctrico</option>
                  <option value="hybrid">Híbrido</option>
                </select>
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Odómetro Base (km)</label>
                <input 
                  type="number"
                  step="0.1"
                  className={styles.input} 
                  {...register('odometer_base', { valueAsNumber: true })} 
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Device ID (Tracker) *</label>
                <input 
                  className={styles.input} 
                  {...register('device_id', { required: 'El ID del dispositivo es obligatorio' })} 
                  placeholder="Ej: TRACKER-001"
                />
                {errors.device_id && <span className={styles.errorText}>{errors.device_id.message}</span>}
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Estado</label>
                <select className={styles.select} {...register('status')}>
                  <option value="active">Activo</option>
                  <option value="inactive">Inactivo</option>
                  <option value="maintenance">Mantenimiento</option>
                </select>
              </div>

            </div>

            <div className={styles.actions}>
              <Dialog.Close asChild>
                <button type="button" className={styles.btnCancel}>Cancelar</button>
              </Dialog.Close>
              <button type="submit" className={styles.btnSubmit} disabled={isSubmitting}>
                {isSubmitting ? 'Guardando...' : 'Guardar Vehículo'}
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
