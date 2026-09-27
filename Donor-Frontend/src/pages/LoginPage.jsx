import { Navigate, useLocation } from "react-router-dom";
import DonorLogin from "../components/auth/DonorLogin";
import { useDonorAuth } from "../context/DonorAuthContext";

export default function LoginPage() {
  const { isAuthenticated } = useDonorAuth();
  const location = useLocation();

  if (isAuthenticated) {
    const from = location.state?.from?.pathname ?? "/";
    return <Navigate to={from} replace />;
  }

  return <DonorLogin />;
}
