import { BrowserRouter, Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import Layout from './components/Layout'
import RequireAuth, { GuestOnly } from './components/RequireAuth'
import ScrollToTop from './components/ScrollToTop'
import ThemedToaster from './components/ThemedToaster'
import { LanguageProvider } from './context/LanguageProvider'
import { ThemeProvider } from './context/ThemeProvider'
import AvailabilityPage from './pages/AvailabilityPage'
import ContactPage from './pages/ContactPage'
import EmergencyPage from './pages/EmergencyPage'
import FaqPage from './pages/FaqPage'
import HomePage from './pages/HomePage'
import HospitalHome from './pages/HospitalHome'
import HospitalLogin from './pages/HospitalLogin'
import HospitalRegister from './pages/HospitalRegister'
import RequestHistoryPage from './pages/RequestHistoryPage'
import RequestPage from './pages/RequestPage'
import { logoutUser } from './lib/auth'

function HospitalLoginRoute() {
  const navigate = useNavigate()

  return (
    <HospitalLogin
      onLogin={() => navigate('/')}
      onRegister={() => navigate('/hospital/register')}
    />
  )
}

function HospitalRegisterRoute() {
  const navigate = useNavigate()

  return (
    <HospitalRegister onSuccess={() => navigate('/')} onLogin={() => navigate('/hospital/login')} />
  )
}

function HospitalHomeRoute() {
  const navigate = useNavigate()

  const handleLogout = () => {
    logoutUser()
    navigate('/hospital/login')
  }

  return <HospitalHome onLogout={handleLogout} />
}

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <BrowserRouter>
          <ScrollToTop />
          <ThemedToaster />
          <Routes>
            <Route path="/hospital/login" element={<GuestOnly><HospitalLoginRoute /></GuestOnly>} />
            <Route path="/hospital/register" element={<GuestOnly><HospitalRegisterRoute /></GuestOnly>} />

            <Route element={<RequireAuth />}>
              <Route element={<Layout />}>
                <Route index element={<HomePage />} />
                <Route path="request" element={<RequestPage />} />
                <Route path="availability" element={<AvailabilityPage />} />
                <Route path="emergency" element={<EmergencyPage />} />
                <Route path="faq" element={<FaqPage />} />
                <Route path="contact" element={<ContactPage />} />
              </Route>

              <Route path="/hospital" element={<Navigate to="/hospital/home" replace />} />
              <Route path="/hospital/home" element={<HospitalHomeRoute />} />
              <Route path="/hospital/history" element={<RequestHistoryPage />} />
              <Route path="/hospital/profile" element={<Navigate to="/hospital/home" replace />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </LanguageProvider>
    </ThemeProvider>
  )
}
