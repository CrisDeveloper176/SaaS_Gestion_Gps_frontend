import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Protects routes that require specific admin roles.
 * Redirects unauthenticated users to /login.
 * Redirects authenticated non-admin users to / (dashboard).
 *
 * Usage:
 *   <AdminRoute roles={['SUPER_ADMIN', 'ORG_ADMIN']}>
 *     <SomeAdminPage />
 *   </AdminRoute>
 */
export default function AdminRoute({ children, roles = ['SUPER_ADMIN', 'ORG_ADMIN'] }) {
  const { isAuth, user } = useAuth();
  const location = useLocation();

  if (!isAuth) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const hasRole = roles.includes(user?.role);
  if (!hasRole) {
    // Authenticated but insufficient privileges — redirect to dashboard
    return <Navigate to="/" replace />;
  }

  return children;
}
