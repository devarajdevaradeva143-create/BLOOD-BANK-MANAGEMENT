import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import { PageLoader } from '../ui/Spinner';

export function ProtectedRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <PageLoader />;
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  // SuperAdmin signed in via the shared /login page belongs in its own area.
  if (user.role === 'SuperAdmin') {
    return <Navigate to="/superadmin/dashboard" replace />;
  }

  return <Outlet />;
}
