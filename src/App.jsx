import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import toast, { Toaster } from 'react-hot-toast';
import { useEffect } from 'react';
import ProtectedRoute from './components/ProtectedRoute';
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

function AdminLayout({ children }) {
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    const ws = new WebSocket(`ws://localhost:8000/ws/tracking/?token=${token}`);

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'alert_triggered') {
          toast(data.message || 'Nueva alerta disparada', {
            icon: '⚠️',
            style: {
              background: '#ef4444',
              color: '#fff',
            },
            duration: 6000,
          });
        }
      } catch (err) {
        console.error('Error parseando mensaje WS:', err);
      }
    };

    return () => {
      ws.close();
    };
  }, []);

  return (
    <ProtectedRoute>
      <Layout>{children}</Layout>
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Registro />} />
          <Route path="/recuperar-password" element={<RecuperarPassword />} />
          <Route path="/" element={<AdminLayout><Dashboard /></AdminLayout>} />
          
          <Route path="/gps" element={<AdminLayout><GPS /></AdminLayout>} />
          <Route path="/vehiculos" element={<AdminLayout><Vehiculos /></AdminLayout>} />
          <Route path="/conductores" element={<AdminLayout><Conductores /></AdminLayout>} />
          <Route path="/alertas" element={<AdminLayout><Alertas /></AdminLayout>} />
          <Route path="/configuracion-alertas" element={<AdminLayout><ConfigurarAlertas /></AdminLayout>} />
          <Route path="/geocercas" element={<AdminLayout><Geocercas /></AdminLayout>} />
          <Route path="/historial-rutas" element={<AdminLayout><HistorialRutas /></AdminLayout>} />
          <Route path="/configuracion" element={<AdminLayout><ConfiguracionOrg /></AdminLayout>} />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
