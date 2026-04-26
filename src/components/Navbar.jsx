import { LogOut, User as UserIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <header style={{
      height: 'var(--navbar-height)',
      position: 'fixed',
      top: 0, right: 0,
      left: 'var(--sidebar-width)',
      background: 'rgba(10, 10, 15, 0.8)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--border-light)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-end',
      padding: '0 32px',
      zIndex: 90
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{user?.email || 'Usuario'}</div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Rol: {user?.role || '---'}</div>
          </div>
          <div style={{
            width: 40, height: 40, borderRadius: '50%',
            background: 'var(--bg-surface-hover)',
            border: '1px solid var(--border-light)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <UserIcon size={18} color="var(--text-secondary)" />
          </div>
        </div>

        {/* Logout button — hover handled via CSS class to avoid React inline-style anti-pattern */}
        <button
          onClick={logout}
          className="navbar-logout-btn"
          aria-label="Cerrar sesión"
          title="Cerrar sesión"
        >
          <LogOut size={20} />
        </button>
      </div>
    </header>
  );
}
