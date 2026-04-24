import { useState, useEffect } from 'react';
import { getVehicles } from '../api/axios';
import { Car, Search, RefreshCw } from 'lucide-react';

export default function Vehiculos() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchVehicles = async () => {
    setLoading(true);
    try {
      const { data } = await getVehicles({ search: searchTerm });
      // Django REST Framework pagination returns { count, next, previous, results }
      setVehicles(data.results || []);
    } catch (err) {
      console.error('Error fetching vehicles:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchVehicles();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

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
        <button onClick={fetchVehicles} className="btn btn-primary" disabled={loading}>
          <RefreshCw size={16} className={loading ? 'animate-pulse' : ''} />
          Recargar
        </button>
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
              <th style={{ padding: '16px 24px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: 13 }}>Status</th>
              <th style={{ padding: '16px 24px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: 13 }}>Device ID</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="4" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  Cargando vehículos...
                </td>
              </tr>
            ) : vehicles.length === 0 ? (
              <tr>
                <td colSpan="4" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No se encontraron vehículos
                </td>
              </tr>
            ) : (
              vehicles.map(v => (
                <tr key={v.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                  <td style={{ padding: '16px 24px', fontWeight: 600 }}>{v.plate}</td>
                  <td style={{ padding: '16px 24px', color: 'var(--text-secondary)' }}>{v.alias || '---'}</td>
                  <td style={{ padding: '16px 24px' }}>
                    <span style={{
                      padding: '4px 10px', borderRadius: '99px', fontSize: 12, fontWeight: 600,
                      background: v.status === 'active' ? 'var(--accent-secondary-glow)' : 'rgba(239, 68, 68, 0.15)',
                      color: v.status === 'active' ? 'var(--accent-secondary)' : '#ef4444'
                    }}>
                      {v.status.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: '16px 24px', fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                    {v.device_id}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
