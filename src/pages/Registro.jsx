import { useState } from 'react';
import { Truck, UserPlus, AlertCircle, ArrowLeft } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { registerTenant } from '../api/axios';
import toast from 'react-hot-toast';

export default function Registro() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    tenant_name: '',
    email: '',
    password: '',
    password_confirm: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (formData.password !== formData.password_confirm) {
      return setError('Las contraseñas no coinciden');
    }

    setLoading(true);
    try {
      await registerTenant(formData);
      toast.success('Organización registrada exitosamente. Ya puedes iniciar sesión.');
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.detail || err.response?.data?.error || 'Error al registrar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="glass-card login-card animate-fade-in" style={{ maxWidth: 450 }}>
        <div className="login-logo">
          <Truck size={48} color="var(--accent-primary)" style={{ marginBottom: 16 }} />
          <h1>Crear Organización</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: 8 }}>
            Registra tu flota y obtén acceso al sistema multi-tenant.
          </p>
        </div>

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#ef4444',
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '13px'
          }}>
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Nombre de la Organización *</label>
            <input
              type="text"
              name="tenant_name"
              className="form-control"
              placeholder="Ej: Transportes del Norte"
              value={formData.tenant_name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email del Administrador *</label>
            <input
              type="email"
              name="email"
              className="form-control"
              placeholder="admin@empresa.com"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">Contraseña *</label>
            <input
              type="password"
              name="password"
              className="form-control"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: 32 }}>
            <label className="form-label">Confirmar Contraseña *</label>
            <input
              type="password"
              name="password_confirm"
              className="form-control"
              placeholder="••••••••"
              value={formData.password_confirm}
              onChange={handleChange}
              required
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', padding: '12px', marginBottom: 16 }}
            disabled={loading}
          >
            <UserPlus size={18} />
            {loading ? 'Registrando...' : 'Registrar'}
          </button>

          <div style={{ textAlign: 'center', fontSize: 13 }}>
            <Link to="/login" style={{ color: 'var(--accent-primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
              <ArrowLeft size={14} /> Volver al Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
