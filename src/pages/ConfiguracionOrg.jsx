import { useState, useEffect } from 'react';
import { Settings, Users, Building, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
// import { getOrgSettings, updateOrgSettings, getOrgUsers, inviteUser } from '../api/axios'; // TODO: Implementar en axios.js

export default function ConfiguracionOrg() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(false);

  // Mock data for UI layout
  const users = [
    { id: 1, email: 'admin@empresa.com', role: 'ORG_ADMIN', active: true },
    { id: 2, email: 'operador@empresa.com', role: 'MANAGER', active: true },
  ];

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 24, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
          <Settings color="var(--accent-primary)" />
          Configuración de la Organización
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
          Administra los ajustes de tu Tenant y controla los accesos de usuario.
        </p>
      </div>

      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
        
        {/* Sidebar Settings */}
        <div className="glass-card" style={{ width: 250, padding: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <button 
            onClick={() => setActiveTab('general')}
            style={{
              padding: '12px 16px', background: activeTab === 'general' ? 'var(--accent-primary-glow)' : 'transparent',
              border: 'none', borderRadius: 8, color: activeTab === 'general' ? 'white' : 'var(--text-secondary)',
              textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, fontWeight: 500,
              transition: 'var(--transition)'
            }}
          >
            <Building size={18} /> General
          </button>
          <button 
            onClick={() => setActiveTab('users')}
            style={{
              padding: '12px 16px', background: activeTab === 'users' ? 'var(--accent-primary-glow)' : 'transparent',
              border: 'none', borderRadius: 8, color: activeTab === 'users' ? 'white' : 'var(--text-secondary)',
              textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, fontWeight: 500,
              transition: 'var(--transition)'
            }}
          >
            <Users size={18} /> Usuarios y Roles
          </button>
        </div>

        {/* Content Area */}
        <div style={{ flex: 1 }}>
          {activeTab === 'general' && (
            <div className="glass-card animate-fade-in" style={{ padding: 24 }}>
              <h2 style={{ fontSize: 18, marginBottom: 24, borderBottom: '1px solid var(--border-light)', paddingBottom: 12 }}>
                Información de la Organización
              </h2>
              <div className="form-group">
                <label className="form-label">Nombre del Tenant</label>
                <input type="text" className="form-control" defaultValue="Transportes del Norte" />
              </div>
              <div className="form-group" style={{ marginBottom: 24 }}>
                <label className="form-label">Plan Actual</label>
                <input type="text" className="form-control" defaultValue="Pro Plan" disabled style={{ opacity: 0.7 }} />
              </div>
              <button className="btn btn-primary">Guardar Cambios</button>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="glass-card animate-fade-in" style={{ padding: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, borderBottom: '1px solid var(--border-light)', paddingBottom: 12 }}>
                <h2 style={{ fontSize: 18 }}>Usuarios del Equipo</h2>
                <button className="btn btn-primary" style={{ padding: '6px 12px', fontSize: 13 }}>+ Invitar Usuario</button>
              </div>
              
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-surface-hover)', borderBottom: '1px solid var(--border-light)' }}>
                    <th style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: 13 }}>Usuario / Email</th>
                    <th style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: 13 }}>Rol</th>
                    <th style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: 13 }}>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                      <td style={{ padding: '16px' }}>{u.email}</td>
                      <td style={{ padding: '16px' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-light)', borderRadius: 6, fontSize: 12 }}>
                          <Shield size={12} color="var(--accent-secondary)" /> {u.role}
                        </span>
                      </td>
                      <td style={{ padding: '16px' }}>
                        <span style={{ color: u.active ? 'var(--accent-secondary)' : '#ef4444', fontSize: 13, fontWeight: 500 }}>
                          {u.active ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
