import { useState, useEffect } from 'react';
import { getVehicles, createVehicle, updateVehicle, deleteVehicle, assignDriver, unassignDriverFromVehicle } from '../api/axios';
import { Car, Search, RefreshCw, Plus, Edit2, Trash2, UserPlus, UserMinus } from 'lucide-react';
import toast from 'react-hot-toast';
import VehicleModal from '../components/VehicleModal';
import AssignDriverToVehicleModal from '../components/AssignDriverToVehicleModal';
import ConfirmModal from '../components/ConfirmModal';
import Pagination from '../components/Pagination';

export default function Vehiculos() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Confirmation modal state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState({ title: '', message: '', onConfirm: () => {} });

  // Pagination state
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);

  const fetchVehicles = async (p = page) => {
    setLoading(true);
    try {
      const { data } = await getVehicles({ search: searchTerm, page: p });
      setVehicles(data.results || []);
      setTotalCount(data.count ?? 0);
      setHasNext(!!data.next);
      setHasPrev(!!data.previous);
    } catch (err) {
      console.error('Error fetching vehicles:', err);
      toast.error('Error al cargar los vehículos. Verifica tu conexión.');
    } finally {
      setLoading(false);
    }
  };

  // Reset to page 1 when search term changes
  useEffect(() => {
    setPage(1);
    const delayDebounceFn = setTimeout(() => fetchVehicles(1), 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  // Fetch when page changes (not triggered by search effect above)
  useEffect(() => {
    fetchVehicles(page);
  }, [page]);

  const handleOpenModal = (vehicle = null) => {
    setSelectedVehicle(vehicle);
    setModalOpen(true);
  };

  const handleOpenAssignModal = (vehicle) => {
    setSelectedVehicle(vehicle);
    setAssignModalOpen(true);
  };

  const handleFormSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      if (selectedVehicle) {
        await updateVehicle(selectedVehicle.id, data);
        toast.success('Vehículo actualizado correctamente');
      } else {
        await createVehicle(data);
        toast.success('Vehículo registrado correctamente');
      }
      setModalOpen(false);
      fetchVehicles(page);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || 'Error al guardar el vehículo');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (id, plate) => {
    setConfirmConfig({
      title: 'Eliminar Vehículo',
      message: `¿Estás seguro de que deseas eliminar el vehículo ${plate}? Esta acción no se puede deshacer.`,
      confirmLabel: 'Eliminar',
      onConfirm: async () => {
        try {
          await deleteVehicle(id);
          toast.success('Vehículo eliminado');
          fetchVehicles(page);
        } catch (err) {
          console.error(err);
          toast.error('Error al eliminar el vehículo');
        }
      },
    });
    setConfirmOpen(true);
  };

  const handleAssignSubmit = async (driverId, vehicleId) => {
    setIsSubmitting(true);
    try {
      await assignDriver(driverId, vehicleId);
      toast.success('Conductor asignado al vehículo correctamente');
      setAssignModalOpen(false);
      fetchVehicles(page);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || 'Error al asignar el conductor');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUnassign = (id, plate) => {
    setConfirmConfig({
      title: 'Desvincular Conductor',
      message: `¿Estás seguro de desvincular al conductor actual del vehículo ${plate}?`,
      confirmLabel: 'Desvincular',
      onConfirm: async () => {
        try {
          await unassignDriverFromVehicle(id);
          toast.success('Conductor desvinculado exitosamente');
          fetchVehicles(page);
        } catch (err) {
          console.error(err);
          toast.error('Error al desvincular conductor');
        }
      },
    });
    setConfirmOpen(true);
  };

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 24, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
            <Car color="var(--accent-primary)" />
            Flota de Vehículos
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
            Gestiona los vehículos de la organización
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={() => fetchVehicles(page)} className="btn btn-secondary" disabled={loading} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-light)', color: 'white', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <RefreshCw size={16} className={loading ? 'animate-pulse' : ''} />
            Recargar
          </button>
          <button onClick={() => handleOpenModal()} className="btn btn-primary" style={{ background: 'var(--accent-primary)', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 500 }}>
            <Plus size={16} />
            Nuevo Vehículo
          </button>
        </div>
      </div>

      <div className="glass-card" style={{ marginBottom: 24, padding: '16px 24px', display: 'flex', gap: 16 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: 16, top: 13 }} />
          <input
            type="text"
            placeholder="Buscar por patente o alias..."
            className="form-control"
            style={{ paddingLeft: 44 }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'var(--bg-surface-hover)', borderBottom: '1px solid var(--border-light)' }}>
              <th style={{ padding: '16px 24px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: 13 }}>Patente</th>
              <th style={{ padding: '16px 24px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: 13 }}>Alias</th>
              <th style={{ padding: '16px 24px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: 13 }}>Conductor</th>
              <th style={{ padding: '16px 24px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: 13 }}>Status</th>
              <th style={{ padding: '16px 24px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: 13 }}>Device ID</th>
              <th style={{ padding: '16px 24px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: 13, textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  Cargando vehículos...
                </td>
              </tr>
            ) : vehicles.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No se encontraron vehículos
                </td>
              </tr>
            ) : (
              vehicles.map((v) => (
                <tr key={v.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                  <td style={{ padding: '16px 24px', fontWeight: 600 }}>{v.plate}</td>
                  <td style={{ padding: '16px 24px', color: 'var(--text-secondary)' }}>{v.alias || '---'}</td>
                  <td style={{ padding: '16px 24px', color: 'var(--text-primary)', fontWeight: 500 }}>
                    {v.current_driver_name ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: 6, fontSize: 13 }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-secondary)' }} />
                        {v.current_driver_name}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Sin asignar</span>
                    )}
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <span style={{
                      padding: '4px 10px', borderRadius: '99px', fontSize: 12, fontWeight: 600,
                      background: v.status === 'active' ? 'var(--accent-secondary-glow)' : 'rgba(239, 68, 68, 0.15)',
                      color: v.status === 'active' ? 'var(--accent-secondary)' : '#ef4444',
                    }}>
                      {v.status?.toUpperCase() ?? 'UNKNOWN'}
                    </span>
                  </td>
                  <td style={{ padding: '16px 24px', fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                    {v.device_id}
                  </td>
                  <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                    {v.current_driver_name ? (
                      <button onClick={() => handleUnassign(v.id, v.plate)} style={{ background: 'transparent', border: 'none', color: '#f59e0b', cursor: 'pointer', marginRight: 12, padding: 4 }} title="Desvincular Conductor">
                        <UserMinus size={16} />
                      </button>
                    ) : (
                      <button onClick={() => handleOpenAssignModal(v)} style={{ background: 'transparent', border: 'none', color: 'var(--accent-secondary)', cursor: 'pointer', marginRight: 12, padding: 4 }} title="Asignar Conductor">
                        <UserPlus size={16} />
                      </button>
                    )}
                    <button onClick={() => handleOpenModal(v)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', marginRight: 12, padding: 4 }} title="Editar">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => handleDelete(v.id, v.plate)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 4 }} title="Eliminar">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <Pagination
          count={totalCount}
          page={page}
          hasNext={hasNext}
          hasPrev={hasPrev}
          loading={loading}
          onNext={() => setPage((p) => p + 1)}
          onPrev={() => setPage((p) => p - 1)}
        />
      </div>

      <VehicleModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        vehicle={selectedVehicle}
        onSubmit={handleFormSubmit}
        isSubmitting={isSubmitting}
      />

      <AssignDriverToVehicleModal
        open={assignModalOpen}
        onOpenChange={setAssignModalOpen}
        vehicle={selectedVehicle}
        onSubmit={handleAssignSubmit}
        isSubmitting={isSubmitting}
      />

      <ConfirmModal
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        confirmLabel={confirmConfig.confirmLabel}
        onConfirm={confirmConfig.onConfirm}
      />
    </div>
  );
}
