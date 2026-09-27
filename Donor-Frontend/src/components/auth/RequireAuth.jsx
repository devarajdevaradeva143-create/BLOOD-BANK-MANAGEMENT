import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useDonorAuth } from "../../context/DonorAuthContext";

export default function RequireAuth() {
  const { isAuthenticated } = useDonorAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
