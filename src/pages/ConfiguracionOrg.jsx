import { useState } from 'react';
import { Settings, Users, Building, Shield, Construction } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
// TODO: Connect real API endpoints when backend org-settings routes are implemented.
// import { getOrgSettings, updateOrgSettings, getOrgUsers, inviteUser } from '../api/axios';

export default function ConfiguracionOrg() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('general');

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

        {/* Settings Sidebar */}
        <div className="glass-card" style={{ width: 250, padding: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <button
            onClick={() => setActiveTab('general')}
            style={{
              padding: '12px 16px',
              background: activeTab === 'general' ? 'var(--accent-primary-glow)' : 'transparent',
              border: 'none', borderRadius: 8,
              color: activeTab === 'general' ? 'white' : 'var(--text-secondary)',
              textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center',
              gap: 12, fontWeight: 500, transition: 'var(--transition)',
            }}
          >
            <Building size={18} /> General
          </button>
          <button
            onClick={() => setActiveTab('users')}
            style={{
              padding: '12px 16px',
              background: activeTab === 'users' ? 'var(--accent-primary-glow)' : 'transparent',
              border: 'none', borderRadius: 8,
              color: activeTab === 'users' ? 'white' : 'var(--text-secondary)',
              textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center',
              gap: 12, fontWeight: 500, transition: 'var(--transition)',
            }}
          >
            <Users size={18} /> Usuarios y Roles
          </button>
        </div>

        {/* Content Area */}
        <div style={{ flex: 1 }}>
          {/* Pending API integration notice */}
          <div style={{
            background: 'rgba(245, 158, 11, 0.08)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            borderRadius: 10,
            padding: '12px 16px',
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontSize: 13,
            color: '#f59e0b',
          }}>
            <Construction size={16} />
            Esta sección está en desarrollo. La integración con la API de organización está pendiente.
          </div>

          {activeTab === 'general' && (
            <div className="glass-card animate-fade-in" style={{ padding: 24 }}>
              <h2 style={{ fontSize: 18, marginBottom: 24, borderBottom: '1px solid var(--border-light)', paddingBottom: 12 }}>
                Información de la Organización
              </h2>
              <div className="form-group">
                <label className="form-label">Nombre del Tenant</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Nombre de la organización"
                  defaultValue={user?.tenant_name ?? ''}
                  disabled
                  style={{ opacity: 0.6, cursor: 'not-allowed' }}
                />
              </div>
              <div className="form-group" style={{ marginBottom: 24 }}>
                <label className="form-label">Plan Actual</label>
                <input
                  type="text"
                  className="form-control"
                  defaultValue="—"
                  disabled
                  style={{ opacity: 0.6, cursor: 'not-allowed' }}
                />
              </div>
              <button className="btn btn-primary" disabled style={{ opacity: 0.5, cursor: 'not-allowed' }}>
                Guardar Cambios (próximamente)
              </button>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="glass-card animate-fade-in" style={{ padding: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, borderBottom: '1px solid var(--border-light)', paddingBottom: 12 }}>
                <h2 style={{ fontSize: 18 }}>Usuarios del Equipo</h2>
                <button
                  className="btn btn-primary"
                  disabled
                  style={{ padding: '6px 12px', fontSize: 13, opacity: 0.5, cursor: 'not-allowed' }}
                >
                  + Invitar Usuario (próximamente)
                </button>
              </div>

              {/* Empty state — no mock data */}
              <div style={{
                padding: '60px 20px',
                textAlign: 'center',
                color: 'var(--text-muted)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 12,
              }}>
                <Users size={40} color="var(--text-muted)" strokeWidth={1} />
                <p style={{ fontSize: 15, color: 'var(--text-secondary)' }}>
                  La lista de usuarios estará disponible cuando la API de organización esté conectada.
                </p>
                <p style={{ fontSize: 12 }}>
                  Conectado como: <strong style={{ color: 'var(--text-primary)' }}>{user?.email}</strong>
                  &nbsp;·&nbsp;Rol: <strong style={{ color: 'var(--accent-primary)' }}>{user?.role}</strong>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
