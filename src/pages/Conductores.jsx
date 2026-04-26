import { useState, useEffect } from 'react';
import { getDrivers, createDriver, updateDriver, deleteDriver, assignDriver } from '../api/axios';
import { Users, Search, RefreshCw, Plus, Edit2, Trash2, Link as LinkIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import DriverModal from '../components/DriverModal';
import AssignDriverModal from '../components/AssignDriverModal';
import ConfirmModal from '../components/ConfirmModal';
import Pagination from '../components/Pagination';

export default function Conductores() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Confirmation modal state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState({ title: '', message: '', onConfirm: () => {} });

  // Pagination state
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);

  const fetchDrivers = async (p = page) => {
    setLoading(true);
    try {
      const { data } = await getDrivers({ search: searchTerm, page: p });
      setDrivers(data.results || []);
      setTotalCount(data.count ?? 0);
      setHasNext(!!data.next);
      setHasPrev(!!data.previous);
    } catch (err) {
      console.error('Error fetching drivers:', err);
      toast.error('Error al cargar los conductores. Verifica tu conexión.');
    } finally {
      setLoading(false);
    }
  };

  // Reset to page 1 when search term changes
  useEffect(() => {
    setPage(1);
    const delayDebounceFn = setTimeout(() => fetchDrivers(1), 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  useEffect(() => {
    fetchDrivers(page);
  }, [page]);

  const handleOpenModal = (driver = null) => {
    setSelectedDriver(driver);
    setModalOpen(true);
  };

  const handleOpenAssignModal = (driver) => {
    setSelectedDriver(driver);
    setAssignModalOpen(true);
  };

  const handleFormSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      if (selectedDriver) {
        await updateDriver(selectedDriver.id, data);
        toast.success('Conductor actualizado');
      } else {
        await createDriver(data);
        toast.success('Conductor registrado');
      }
      setModalOpen(false);
      fetchDrivers(page);
    } catch (err) {
      console.error(err);
      toast.error('Error al guardar el conductor');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (id, name) => {
    setConfirmConfig({
      title: 'Eliminar Conductor',
      message: `¿Estás seguro de que deseas eliminar al conductor ${name}? Esta acción no se puede deshacer.`,
      confirmLabel: 'Eliminar',
      onConfirm: async () => {
        try {
          await deleteDriver(id);
          toast.success('Conductor eliminado');
          fetchDrivers(page);
        } catch (err) {
          console.error(err);
          toast.error('Error al eliminar');
        }
      },
    });
    setConfirmOpen(true);
  };

  const handleAssignSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      await assignDriver(selectedDriver.id, data.vehicle_id);
      toast.success('Vehículo asignado correctamente');
      setAssignModalOpen(false);
      fetchDrivers(page);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || 'Error al asignar vehículo');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 24, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
            <Users color="var(--accent-primary)" />
            Conductores
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
            Directorio de choferes registrados en el sistema
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={() => fetchDrivers(page)} className="btn btn-secondary" disabled={loading} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-light)', color: 'white', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <RefreshCw size={16} className={loading ? 'animate-pulse' : ''} />
            Recargar
          </button>
          <button onClick={() => handleOpenModal()} className="btn btn-primary" style={{ background: 'var(--accent-primary)', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 500 }}>
            <Plus size={16} />
            Nuevo Conductor
          </button>
        </div>
      </div>

      <div className="glass-card" style={{ marginBottom: 24, padding: '16px 24px', display: 'flex', gap: 16 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: 16, top: 13 }} />
          <input
            type="text"
            placeholder="Buscar por nombre o licencia..."
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
              <th style={{ padding: '16px 24px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: 13 }}>Nombre Completo</th>
              <th style={{ padding: '16px 24px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: 13 }}>Licencia</th>
              <th style={{ padding: '16px 24px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: 13 }}>Estado</th>
              <th style={{ padding: '16px 24px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: 13, textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="4" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  Cargando conductores...
                </td>
              </tr>
            ) : drivers.length === 0 ? (
              <tr>
                <td colSpan="4" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No se encontraron conductores
                </td>
              </tr>
            ) : (
              drivers.map((d) => (
                <tr key={d.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                  <td style={{ padding: '16px 24px', fontWeight: 600 }}>{d.name}</td>
                  <td style={{ padding: '16px 24px', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{d.license_number || '---'}</td>
                  <td style={{ padding: '16px 24px' }}>
                    <span style={{
                      padding: '4px 10px', borderRadius: '99px', fontSize: 12, fontWeight: 600,
                      background: d.is_active ? 'var(--accent-secondary-glow)' : 'rgba(239, 68, 68, 0.15)',
                      color: d.is_active ? 'var(--accent-secondary)' : '#ef4444',
                    }}>
                      {d.is_active ? 'ACTIVO' : 'INACTIVO'}
                    </span>
                  </td>
                  <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                    <button onClick={() => handleOpenAssignModal(d)} style={{ background: 'transparent', border: 'none', color: 'var(--accent-secondary)', cursor: 'pointer', marginRight: 12, padding: 4 }} title="Asignar a Vehículo">
                      <LinkIcon size={16} />
                    </button>
                    <button onClick={() => handleOpenModal(d)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', marginRight: 12, padding: 4 }} title="Editar">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => handleDelete(d.id, d.name)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 4 }} title="Eliminar">
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

      <DriverModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        driver={selectedDriver}
        onSubmit={handleFormSubmit}
        isSubmitting={isSubmitting}
      />

      <AssignDriverModal
        open={assignModalOpen}
        onOpenChange={setAssignModalOpen}
        driver={selectedDriver}
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
