import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { loginRequest } from '../api/axios';

const AuthContext = createContext(null);

/**
 * NOTE: <AuthProvider> must be rendered INSIDE <BrowserRouter> so that
 * useNavigate works correctly for the logout redirect.
 * See App.jsx for the correct nesting order.
 */
export function AuthProvider({ children }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
    navigate('/login', { replace: true });
  }, [navigate]);

  // Bootstrap: validate persisted token on app load
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        if (decoded.exp * 1000 < Date.now()) {
          // Token expired — clean up silently
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
        } else {
          setUser(decoded);
        }
      } catch {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
      }
    }
    setLoading(false);
  }, []);

  // Listen for the auth:session-expired event dispatched by the axios interceptor.
  // This cleans up React state AND navigates without a full page reload.
  useEffect(() => {
    const handler = () => logout();
    window.addEventListener('auth:session-expired', handler);
    return () => window.removeEventListener('auth:session-expired', handler);
  }, [logout]);

  const login = async (username, password) => {
    const { data } = await loginRequest(username, password);
    localStorage.setItem('access_token', data.access);
    localStorage.setItem('refresh_token', data.refresh);
    const decoded = jwtDecode(data.access);
    setUser(decoded);
  };

  if (loading) {
    return (
      <div className="login-wrapper">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div className="auth-spinner" />
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Verificando sesión...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuth: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
