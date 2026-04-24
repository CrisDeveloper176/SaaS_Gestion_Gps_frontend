import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Truck, LogIn, AlertCircle } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.detail || 'Credenciales inválidas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="glass-card login-card animate-fade-in">
        <div className="login-logo">
          <Truck size={48} color="var(--accent-primary)" style={{ marginBottom: 16 }} />
          <h1>Fleet SaaS</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: 8 }}>
            Plataforma de gestión y rastreo en tiempo real
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
            <label className="form-label">Usuario o Email</label>
            <input
              type="text"
              className="form-control"
              placeholder="admin@fleet.com"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          
          <div className="form-group" style={{ marginBottom: 32 }}>
            <label className="form-label">Contraseña</label>
            <input
              type="password"
              className="form-control"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', padding: '12px' }}
            disabled={loading}
          >
            <LogIn size={18} />
            {loading ? 'Ingresando...' : 'Iniciar Sesión'}
          </button>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16, fontSize: 13 }}>
            <Link to="/recuperar-password" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>
              ¿Olvidaste tu contraseña?
            </Link>
            <Link to="/registro" style={{ color: 'var(--accent-primary)', textDecoration: 'none', fontWeight: 500 }}>
              Crear Organización
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
