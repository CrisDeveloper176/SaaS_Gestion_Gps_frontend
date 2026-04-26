import { useState, useEffect } from 'react';
import { getAlerts, markAlertAsRead } from '../api/axios';
import { Bell, RefreshCw, AlertTriangle, AlertCircle, Info, CheckCircle } from 'lucide-react';
import { useWebSocket } from '../context/WebSocketContext';
import Pagination from '../components/Pagination';

export default function Alertas() {
  const { subscribe } = useWebSocket();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pagination state driven by DRF's next/previous fields
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);

  const fetchAlerts = async (p = page) => {
    setLoading(true);
    try {
      const { data } = await getAlerts({ page: p });
      setAlerts(data.results || []);
      setTotalCount(data.count ?? 0);
      setHasNext(!!data.next);
      setHasPrev(!!data.previous);
    } catch (err) {
      console.error('Error fetching alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts(page);
  }, [page]);

  // Subscribe to real-time alert_triggered events from the shared WebSocket.
  // New alerts are prepended to the list so they appear immediately without a reload.
  useEffect(() => {
    const unsubscribe = subscribe('alert_triggered', (data) => {
      setAlerts((prev) => [
        {
          id: data.id ?? `ws-${Date.now()}`,
          vehicle_plate: data.vehicle_plate ?? data.plate ?? '---',
          alert_type: data.alert_type ?? 'UNKNOWN',
          severity: data.severity ?? null,
          message: data.message ?? data.description ?? 'Nueva alerta recibida',
          timestamp: data.timestamp ?? new Date().toISOString(),
          is_read: false,
        },
        ...prev,
      ]);
      setTotalCount((c) => c + 1);
    });
    return unsubscribe;
  }, [subscribe]);

  const handleMarkAsRead = async (id) => {
    // Optimistic update — no full refetch needed
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, is_read: true } : a)));
    try {
      await markAlertAsRead(id);
    } catch (err) {
      console.error('Error marking alert as read:', err);
      // Revert on failure
      setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, is_read: false } : a)));
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'CRITICAL': return '#ef4444';
      case 'WARNING':  return '#f59e0b';
      case 'INFO':     return '#3b82f6';
      default:         return 'var(--text-secondary)';
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'CRITICAL': return <AlertTriangle size={16} color="#ef4444" />;
      case 'WARNING':  return <AlertCircle   size={16} color="#f59e0b" />;
      case 'INFO':     return <Info          size={16} color="#3b82f6" />;
      default:         return <Bell          size={16} color="var(--text-secondary)" />;
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
            {totalCount > 0 && (
              <span style={{ marginLeft: 10, padding: '2px 8px', background: 'var(--accent-primary-glow)', borderRadius: 6, color: 'var(--accent-primary)', fontWeight: 600 }}>
                {totalCount}
              </span>
            )}
          </p>
        </div>
        <button onClick={() => fetchAlerts(page)} className="btn btn-primary" disabled={loading}>
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
              alerts.map((a) => (
                <tr key={a.id} style={{ borderBottom: '1px solid var(--border-light)', opacity: a.is_read ? 0.6 : 1 }}>
                  <td style={{ padding: '16px 24px', fontWeight: 600, fontFamily: 'monospace', color: 'var(--accent-primary)' }}>
                    {a.vehicle_plate}
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {getSeverityIcon(a.severity ?? (a.alert_type === 'SPEEDING' ? 'CRITICAL' : 'WARNING'))}
                      <span style={{ color: getSeverityColor(a.severity ?? (a.alert_type === 'SPEEDING' ? 'CRITICAL' : 'WARNING')), fontWeight: 600, fontSize: 12 }}>
                        {a.alert_type}
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: '16px 24px', color: 'var(--text-secondary)' }}>{a.message}</td>
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
    </div>
  );
}
