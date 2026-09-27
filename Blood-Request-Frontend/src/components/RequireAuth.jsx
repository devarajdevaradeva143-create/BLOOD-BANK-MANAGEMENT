import { Navigate, Outlet } from 'react-router-dom'
import { isLoggedIn } from '../lib/auth'

export default function RequireAuth() {
  if (!isLoggedIn()) {
    return <Navigate to="/hospital/login" replace />
  }

  return <Outlet />
}

export function GuestOnly({ children }) {
  if (isLoggedIn()) {
    return <Navigate to="/" replace />
  }

  return children
}
