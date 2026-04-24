import { useState, useEffect } from 'react';
import { getAlerts, markAlertAsRead } from '../api/axios';
import { Bell, RefreshCw, AlertTriangle, AlertCircle, Info, CheckCircle } from 'lucide-react';

export default function Alertas() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const { data } = await getAlerts();
      setAlerts(data.results || []);
    } catch (err) {
      console.error('Error fetching alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      await markAlertAsRead(id);
      fetchAlerts(); // recargar la lista
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  const getSeverityColor = (severity) => {
    switch(severity) {
      case 'CRITICAL': return '#ef4444'; // Red
      case 'WARNING': return '#f59e0b'; // Amber
      case 'INFO': return '#3b82f6'; // Blue
      default: return 'var(--text-secondary)';
    }
  };

  const getSeverityIcon = (severity) => {
    switch(severity) {
      case 'CRITICAL': return <AlertTriangle size={16} color="#ef4444" />;
      case 'WARNING': return <AlertCircle size={16} color="#f59e0b" />;
      case 'INFO': return <Info size={16} color="#3b82f6" />;
      default: return <Bell size={16} color="var(--text-secondary)" />;
    }
  };

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 24, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
            <Bell color="var(--accent-primary)" />
            Bandeja de Alertas
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
            Eventos, excesos de velocidad y notificaciones de la flota
          </p>
        </div>
        <button onClick={fetchAlerts} className="btn btn-primary" disabled={loading}>
          <RefreshCw size={16} className={loading ? 'animate-pulse' : ''} />
          Recargar
        </button>
      </div>

      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'var(--bg-surface-hover)', borderBottom: '1px solid var(--border-light)' }}>
              <th style={{ padding: '16px 24px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: 13 }}>Vehículo</th>
              <th style={{ padding: '16px 24px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: 13 }}>Regla / Severidad</th>
              <th style={{ padding: '16px 24px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: 13 }}>Mensaje</th>
              <th style={{ padding: '16px 24px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: 13 }}>Fecha y Hora</th>
              <th style={{ padding: '16px 24px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: 13, textAlign: 'right' }}>Acción</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  Cargando alertas...
                </td>
              </tr>
            ) : alerts.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No hay alertas registradas
                </td>
              </tr>
            ) : (
              alerts.map(a => (
                <tr key={a.id} style={{ borderBottom: '1px solid var(--border-light)', opacity: a.is_read ? 0.6 : 1 }}>
                  <td style={{ padding: '16px 24px', fontWeight: 600, fontFamily: 'monospace', color: 'var(--accent-primary)' }}>
                    {a.vehicle_plate}
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {getSeverityIcon(a.alert_type === 'SPEEDING' ? 'CRITICAL' : 'WARNING')}
                      <span style={{ color: getSeverityColor(a.alert_type === 'SPEEDING' ? 'CRITICAL' : 'WARNING'), fontWeight: 600, fontSize: 12 }}>
                        {a.alert_type}
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: '16px 24px', color: 'var(--text-secondary)' }}>
                    {a.message}
                  </td>
                  <td style={{ padding: '16px 24px', color: 'var(--text-muted)', fontSize: 13 }}>
                    {new Date(a.timestamp).toLocaleString()}
                  </td>
                  <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                    {!a.is_read ? (
                      <button 
                        onClick={() => handleMarkAsRead(a.id)}
                        style={{ background: 'transparent', border: 'none', color: 'var(--accent-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, marginLeft: 'auto' }}
                      >
                        <CheckCircle size={16} /> Marcar Leída
                      </button>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end' }}>
                        <CheckCircle size={16} /> Leída
                      </span>
                    )}
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
