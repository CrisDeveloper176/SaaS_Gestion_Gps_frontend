import { useState, useEffect } from 'react';
import { getAnalyticsSummary } from '../api/axios';
import { Activity, Car, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await getAnalyticsSummary();
        setStats(data);
      } catch (err) {
        console.error("Error fetching analytics", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 24, marginBottom: 8 }}>Dashboard</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
          Métricas y estado general de la flota
        </p>
      </div>

      {loading ? (
        <div style={{ color: 'var(--text-muted)' }}>Cargando métricas...</div>
      ) : stats ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
          <StatCard 
            icon={<Car size={24} color="var(--accent-primary)" />} 
            label="Total Vehículos" 
            value={stats.vehicles?.total || 0} 
            color="var(--accent-primary)"
          />
          <StatCard 
            icon={<Activity size={24} color="var(--accent-secondary)" />} 
            label="Vehículos Activos" 
            value={stats.vehicles?.active || 0} 
            color="var(--accent-secondary)"
          />
          <StatCard 
            icon={<AlertTriangle size={24} color="#ef4444" />} 
            label="Alertas Recientes" 
            value={stats.alerts?.total_last_24h || 0} 
            color="#ef4444"
          />
          <StatCard 
            icon={<ShieldCheck size={24} color="#f59e0b" />} 
            label="Total Conductores" 
            value={stats.drivers || 0} 
            color="#f59e0b"
          />
        </div>
      ) : (
        <div className="glass-card" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
          No se pudieron cargar las estadísticas.
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, color }) {
  return (
    <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
      <div style={{
        width: 50, height: 50,
        borderRadius: 12,
        background: `rgba(255,255,255,0.05)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: `1px solid ${color}40`
      }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 32, fontWeight: 800, lineHeight: 1.2, fontFamily: 'Outfit' }}>{value}</div>
        <div style={{ fontSize: 12, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {label}
        </div>
      </div>
    </div>
  );
}
