import { Navigate } from "react-router-dom";
import DonorRegister from "../components/auth/DonorRegister";
import { useDonorAuth } from "../context/DonorAuthContext";

export default function RegisterPage() {
  const { isAuthenticated } = useDonorAuth();

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <DonorRegister />;
}
