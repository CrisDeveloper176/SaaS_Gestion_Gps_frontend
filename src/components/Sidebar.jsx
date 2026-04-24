import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Truck, Users, Map, Bell, Settings } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ORG_ADMIN';

  return (
    <aside style={{
      width: 'var(--sidebar-width)',
      height: '100vh',
      position: 'fixed',
      top: 0, left: 0,
      background: 'rgba(18, 18, 26, 0.8)',
      backdropFilter: 'blur(16px)',
      borderRight: '1px solid var(--border-light)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 100
    }}>
      <div style={{
        padding: '24px',
        borderBottom: '1px solid var(--border-light)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <div style={{
          width: 36, height: 36, 
          background: 'linear-gradient(135deg, var(--accent-primary), #818cf8)',
          borderRadius: 8,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'white',
          boxShadow: 'var(--shadow-glow)'
        }}>
          <Truck size={20} />
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 16, fontFamily: 'Outfit' }}>Fleet SaaS</div>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Admin Panel</div>
        </div>
      </div>

      <nav style={{ padding: '20px 16px', flex: 1 }}>
        <div style={{
          fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
          letterSpacing: '0.1em', color: 'var(--text-muted)',
          marginBottom: 12, paddingLeft: 12
        }}>Menú Principal</div>

        <NavItem to="/" icon={<LayoutDashboard size={18} />} label="Dashboard" />
        <NavItem to="/gps" icon={<Map size={18} />} label="Tracking GPS" />
        <NavItem to="/vehiculos" icon={<Truck size={18} />} label="Flota (Vehículos)" />
        <NavItem to="/conductores" icon={<Users size={18} />} label="Conductores" />
        <NavItem to="/alertas" icon={<Bell size={18} />} label="Alertas" />
        
        {isAdmin && (
          <>
            <div style={{
              fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
              letterSpacing: '0.1em', color: 'var(--text-muted)',
              marginTop: 30, marginBottom: 12, paddingLeft: 12
            }}>Administración</div>
            <NavItem to="/configuracion" icon={<Settings size={18} />} label="Ajustes de Tenant" />
          </>
        )}
      </nav>
    </aside>
  );
}

function NavItem({ to, icon, label }) {
  return (
    <NavLink
      to={to}
      style={({ isActive }) => ({
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px',
        borderRadius: 'var(--radius-sm)',
        color: isActive ? '#fff' : 'var(--text-secondary)',
        background: isActive ? 'var(--accent-primary-glow)' : 'transparent',
        border: isActive ? '1px solid var(--border-focus)' : '1px solid transparent',
        marginBottom: '4px',
        transition: 'var(--transition)',
        fontSize: '14px',
        fontWeight: isActive ? 600 : 500
      })}
    >
      {icon}
      {label}
    </NavLink>
  );
}
