import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';
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
import ConfiguracionOrg from './pages/ConfiguracionOrg';

function AdminLayout({ children }) {
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
          <Route path="/configuracion" element={<AdminLayout><ConfiguracionOrg /></AdminLayout>} />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
