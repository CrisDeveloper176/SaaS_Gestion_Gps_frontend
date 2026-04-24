import { useState, useEffect } from 'react';
import { getDrivers } from '../api/axios';
import { Users, Search, RefreshCw } from 'lucide-react';

export default function Conductores() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchDrivers = async () => {
    setLoading(true);
    try {
      const { data } = await getDrivers({ search: searchTerm });
      setDrivers(data.results || []);
    } catch (err) {
      console.error('Error fetching drivers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchDrivers();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

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
        <button onClick={fetchDrivers} className="btn btn-primary" disabled={loading}>
          <RefreshCw size={16} className={loading ? 'animate-pulse' : ''} />
          Recargar
        </button>
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
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="3" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  Cargando conductores...
                </td>
              </tr>
            ) : drivers.length === 0 ? (
              <tr>
                <td colSpan="3" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No se encontraron conductores
                </td>
              </tr>
            ) : (
              drivers.map(d => (
                <tr key={d.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                  <td style={{ padding: '16px 24px', fontWeight: 600 }}>{d.name}</td>
                  <td style={{ padding: '16px 24px', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{d.license_number || '---'}</td>
                  <td style={{ padding: '16px 24px' }}>
                    <span style={{
                      padding: '4px 10px', borderRadius: '99px', fontSize: 12, fontWeight: 600,
                      background: d.is_active ? 'var(--accent-secondary-glow)' : 'rgba(239, 68, 68, 0.15)',
                      color: d.is_active ? 'var(--accent-secondary)' : '#ef4444'
                    }}>
                      {d.is_active ? 'ACTIVO' : 'INACTIVO'}
                    </span>
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
