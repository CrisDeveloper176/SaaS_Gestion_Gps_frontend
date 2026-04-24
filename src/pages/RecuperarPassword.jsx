import { useState } from 'react';
import { Truck, Key, AlertCircle, ArrowLeft } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { requestPasswordReset } from '../api/axios';
import toast from 'react-hot-toast';

export default function RecuperarPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await requestPasswordReset({ email });
      toast.success('Si el correo existe, recibirás instrucciones pronto.');
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.error || 'Error al procesar la solicitud');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="glass-card login-card animate-fade-in">
        <div className="login-logo">
          <Truck size={48} color="var(--accent-primary)" style={{ marginBottom: 16 }} />
          <h1>Recuperar Contraseña</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: 8 }}>
            Ingresa tu correo para recibir un enlace de recuperación.
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
          <div className="form-group" style={{ marginBottom: 32 }}>
            <label className="form-label">Email de la cuenta</label>
            <input
              type="email"
              className="form-control"
              placeholder="admin@fleet.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', padding: '12px', marginBottom: 16 }}
            disabled={loading}
          >
            <Key size={18} />
            {loading ? 'Enviando...' : 'Solicitar Enlace'}
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
