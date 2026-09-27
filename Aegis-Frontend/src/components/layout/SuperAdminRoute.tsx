import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import { PageLoader } from '../ui/Spinner';

export function SuperAdminRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <PageLoader />;
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (user.role !== 'SuperAdmin') {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
