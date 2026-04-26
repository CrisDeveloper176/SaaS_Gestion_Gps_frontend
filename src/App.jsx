import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { WebSocketProvider, useWebSocket } from './context/WebSocketContext';
import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';
import { useEffect } from 'react';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import Layout from './components/Layout';

import Login from './pages/Login';
import Registro from './pages/Registro';
import RecuperarPassword from './pages/RecuperarPassword';
import Dashboard from './pages/Dashboard';
import Vehiculos from './pages/Vehiculos';
import Conductores from './pages/Conductores';
import GPS from './pages/GPS';
import Alertas from './pages/Alertas';
import ConfigurarAlertas from './pages/ConfigurarAlertas';
import Geocercas from './pages/Geocercas';
import HistorialRutas from './pages/HistorialRutas';
import ConfiguracionOrg from './pages/ConfiguracionOrg';

/**
 * GlobalAlertListener — subscribes to WebSocket alert_triggered events
 * and shows toast notifications. Lives inside WebSocketProvider so it
 * has access to the shared WS connection. Renders nothing.
 */
function GlobalAlertListener() {
  const { subscribe } = useWebSocket();

  useEffect(() => {
    const unsubscribe = subscribe('alert_triggered', (data) => {
      toast(data.message || 'Nueva alerta disparada', {
        icon: '⚠️',
        style: {
          background: '#ef4444',
          color: '#fff',
        },
        duration: 6000,
      });
    });
    return unsubscribe;
  }, [subscribe]);

  return null;
}

/**
 * AdminLayout wraps all protected pages with auth guard + shared layout.
 * Defined at MODULE SCOPE (not inside App) so React doesn't create a new
 * component type on every App render, which would cause unnecessary remounts.
 */
function AdminLayout({ children }) {
  return (
    <ProtectedRoute>
      <Layout>{children}</Layout>
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    // BrowserRouter must be outermost so AuthProvider can use useNavigate
    <BrowserRouter>
      <AuthProvider>
        <WebSocketProvider>
          <Toaster position="top-right" />
          <GlobalAlertListener />
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/registro" element={<Registro />} />
            <Route path="/recuperar-password" element={<RecuperarPassword />} />

            {/* Protected routes — any authenticated user */}
            <Route path="/" element={<AdminLayout><Dashboard /></AdminLayout>} />
            <Route path="/gps" element={<AdminLayout><GPS /></AdminLayout>} />
            <Route path="/vehiculos" element={<AdminLayout><Vehiculos /></AdminLayout>} />
            <Route path="/conductores" element={<AdminLayout><Conductores /></AdminLayout>} />
            <Route path="/alertas" element={<AdminLayout><Alertas /></AdminLayout>} />
            <Route path="/geocercas" element={<AdminLayout><Geocercas /></AdminLayout>} />
            <Route path="/historial-rutas" element={<AdminLayout><HistorialRutas /></AdminLayout>} />

            {/* Admin-only routes — role-protected at router level */}
            <Route
              path="/configuracion-alertas"
              element={
                <AdminRoute>
                  <AdminLayout><ConfigurarAlertas /></AdminLayout>
                </AdminRoute>
              }
            />
            <Route
              path="/configuracion"
              element={
                <AdminRoute>
                  <AdminLayout><ConfiguracionOrg /></AdminLayout>
                </AdminRoute>
              }
            />

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </WebSocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
