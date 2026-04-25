import { useState, useEffect } from 'react';
import { getAnalyticsSummary } from '../api/axios';
import {
  Activity, Car, AlertTriangle, ShieldCheck, MapPin,
  Route, Users, TrendingUp, Gauge
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell, Legend
} from 'recharts';

const CHART_COLORS = ['#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6', '#ec4899'];

const ALERT_TYPE_LABELS = {
  'SPEEDING': 'Exceso Velocidad',
  'IDLE_TOO_LONG': 'Ralentí',
  'GEOFENCE_EXIT': 'Salida Geocerca',
  'OFF_HOURS_USAGE': 'Fuera de Horario',
};

const chartTooltipStyle = {
  backgroundColor: 'rgba(18, 18, 26, 0.95)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 8,
  color: '#e2e8f0',
  fontSize: 13,
};

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

  if (loading) {
    return (
      <div className="animate-fade-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300, color: 'var(--text-muted)' }}>
        Cargando dashboard...
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="animate-fade-in glass-card" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>
        No se pudieron cargar las estadísticas.
      </div>
    );
  }

  // Transform alerts by type for pie chart
  const alertsByType = (stats.alerts?.by_type || []).map(item => ({
    name: ALERT_TYPE_LABELS[item.rule__alert_type] || item.rule__alert_type,
    value: item.count,
  }));

  // Transform top vehicles
  const topVehicles = (stats.top_vehicles || []).map(v => ({
    plate: v.vehicle__plate,
    km: v.total_km,
  }));

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 24, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
          <TrendingUp color="var(--accent-primary)" />
          Dashboard
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
          Métricas y estado general de la flota — últimos 7 días
        </p>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        <StatCard icon={<Car size={22} color="#3b82f6" />} label="Vehículos" value={stats.vehicles?.total || 0} sub={`${stats.vehicles?.active || 0} activos`} color="#3b82f6" />
        <StatCard icon={<Users size={22} color="#8b5cf6" />} label="Conductores" value={stats.drivers?.total || 0} sub={`${stats.drivers?.active || 0} activos`} color="#8b5cf6" />
        <StatCard icon={<AlertTriangle size={22} color="#ef4444" />} label="Alertas (24h)" value={stats.alerts?.last_24h || 0} sub={`${stats.alerts?.unread || 0} sin leer`} color="#ef4444" />
        <StatCard icon={<Route size={22} color="#10b981" />} label="Viajes (7d)" value={stats.trips?.count_7d || 0} sub={`${stats.trips?.total_distance_km || 0} km total`} color="#10b981" />
        <StatCard icon={<Gauge size={22} color="#f59e0b" />} label="Vel. Máxima" value={`${stats.trips?.max_speed || 0}`} sub="km/h registrados" color="#f59e0b" />
        <StatCard icon={<MapPin size={22} color="#ec4899" />} label="Geocercas" value={stats.geofences?.active || 0} sub="activas" color="#ec4899" />
      </div>

      {/* Charts Row 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* Alertas por día */}
        <div className="glass-card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 20, color: 'var(--text-primary)' }}>
            Alertas por Día
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={stats.alerts?.by_day || []}>
              <defs>
                <linearGradient id="alertGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="day" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} allowDecimals={false} />
              <Tooltip contentStyle={chartTooltipStyle} />
              <Area type="monotone" dataKey="count" stroke="#ef4444" fill="url(#alertGradient)" strokeWidth={2} name="Alertas" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Alertas por tipo (pie) */}
        <div className="glass-card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 20, color: 'var(--text-primary)' }}>
            Alertas por Tipo
          </h3>
          {alertsByType.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={alertsByType}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {alertsByType.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={chartTooltipStyle} />
                <Legend
                  wrapperStyle={{ fontSize: 11, color: '#94a3b8' }}
                  iconType="circle"
                  iconSize={8}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
              Sin alertas en los últimos 7 días
            </div>
          )}
        </div>
      </div>

      {/* Charts Row 2 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* Distancia por día */}
        <div className="glass-card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 20, color: 'var(--text-primary)' }}>
            Distancia Recorrida por Día (km)
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={stats.trips?.by_day || []}>
              <defs>
                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.3} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="day" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} />
              <Tooltip contentStyle={chartTooltipStyle} />
              <Bar dataKey="distance_km" fill="url(#barGradient)" radius={[6, 6, 0, 0]} name="Km" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top vehículos */}
        <div className="glass-card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 20, color: 'var(--text-primary)' }}>
            Top 5 Vehículos (km recorridos)
          </h3>
          {topVehicles.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={topVehicles} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} />
                <YAxis type="category" dataKey="plate" tick={{ fill: '#94a3b8', fontSize: 12, fontFamily: 'monospace' }} axisLine={false} width={80} />
                <Tooltip contentStyle={chartTooltipStyle} />
                <Bar dataKey="km" fill="#10b981" radius={[0, 6, 6, 0]} name="Km" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
              Sin viajes registrados
            </div>
          )}
        </div>
      </div>

      {/* Quick Summary Row */}
      <div className="glass-card" style={{ padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
          <MiniStat label="Vel. Promedio" value={`${stats.trips?.avg_speed || 0} km/h`} />
          <div style={{ width: 1, background: 'var(--border-light)' }} />
          <MiniStat label="Alertas Totales" value={stats.alerts?.total || 0} />
          <div style={{ width: 1, background: 'var(--border-light)' }} />
          <MiniStat label="Viajes Totales (7d)" value={stats.trips?.count_7d || 0} />
          <div style={{ width: 1, background: 'var(--border-light)' }} />
          <MiniStat label="Distancia Total (7d)" value={`${stats.trips?.total_distance_km || 0} km`} />
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, sub, color }) {
  return (
    <div className="glass-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: 16 }}>
      <div style={{
        width: 46, height: 46, borderRadius: 12,
        background: `${color}15`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: `1px solid ${color}30`,
        flexShrink: 0
      }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 28, fontWeight: 800, lineHeight: 1.1, fontFamily: 'Outfit' }}>{value}</div>
        <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{sub}</div>}
      </div>
    </div>
  );
}

function MiniStat({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'Outfit', color: 'var(--text-primary)' }}>{value}</div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{label}</div>
    </div>
  );
}
