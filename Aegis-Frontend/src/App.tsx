import { BrowserRouter, Navigate, Route, Routes } from 'react-router';
import { ThemeProvider } from './context/ThemeContext';
import { I18nProvider } from './i18n/I18nContext';
import { AuthProvider } from './context/AuthContext';
import { UnitProvider } from './context/UnitContext';
import { AppToaster } from './components/AppToaster';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { SuperAdminRoute } from './components/layout/SuperAdminRoute';
import { SuperAdminLayout } from './components/superadmin/SuperAdminLayout';
import { Layout } from './components/layout/Layout';
import LoginPage from './pages/LoginPage';
import SuperAdminLoginPage from './pages/superadmin/SuperAdminLoginPage';
import SuperAdminDashboardPage from './pages/superadmin/DashboardPage';
import ApprovalsPage from './pages/superadmin/ApprovalsPage';
import ManageAdminsPage from './pages/superadmin/AdminsPage';
import ManageHospitalsPage from './pages/superadmin/HospitalsPage';
import BloodBanksPage from './pages/superadmin/BloodBanksPage';
import DonorsPage from './pages/superadmin/DonorsPage';
import BloodRequestsPage from './pages/superadmin/RequestsPage';
import InventoryPage from './pages/superadmin/InventoryPage';
import DistrictsPage from './pages/superadmin/DistrictsPage';
import ReportsPage from './pages/superadmin/ReportsPage';
import SuperAdminProfilePage from './pages/superadmin/ProfilePage';
import SuperAdminSettingsPage from './pages/superadmin/SettingsPage';
import DashboardPage from './pages/DashboardPage';
import BloodUnitsPage from './pages/BloodUnitsPage';
import AddUnitPage from './pages/AddUnitPage';
import TestingPage from './pages/TestingPage';
import ExpiryPage from './pages/ExpiryPage';
import HistoryPage from './pages/HistoryPage';
import SettingsPage from './pages/SettingsPage';

export default function App() {
  return (
    <ThemeProvider>
      <I18nProvider>
        <AuthProvider>
          <UnitProvider>
            <BrowserRouter>
              <AppToaster />
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/superadmin/login" element={<SuperAdminLoginPage />} />
                <Route element={<SuperAdminRoute />}>
                  <Route element={<SuperAdminLayout />}>
                    <Route path="/superadmin/dashboard" element={<SuperAdminDashboardPage />} />
                    <Route path="/superadmin/approvals" element={<ApprovalsPage />} />
                    <Route path="/superadmin/admins" element={<ManageAdminsPage />} />
                    <Route path="/superadmin/hospitals" element={<ManageHospitalsPage />} />
                    <Route path="/superadmin/banks" element={<BloodBanksPage />} />
                    <Route path="/superadmin/donors" element={<DonorsPage />} />
                    <Route path="/superadmin/requests" element={<BloodRequestsPage />} />
                    <Route path="/superadmin/inventory" element={<InventoryPage />} />
                    <Route path="/superadmin/districts" element={<DistrictsPage />} />
                    <Route path="/superadmin/reports" element={<ReportsPage />} />
                    <Route path="/superadmin/profile" element={<SuperAdminProfilePage />} />
                    <Route path="/superadmin/settings" element={<SuperAdminSettingsPage />} />
                  </Route>
                </Route>
                <Route element={<ProtectedRoute />}>
                  <Route element={<Layout />}>
                    <Route index element={<Navigate to="/dashboard" replace />} />
                    <Route path="/dashboard" element={<DashboardPage />} />
                    <Route path="/units" element={<BloodUnitsPage />} />
                    <Route path="/units/new" element={<AddUnitPage />} />
                    <Route path="/testing" element={<TestingPage />} />
                    <Route path="/expiry" element={<ExpiryPage />} />
                    <Route path="/history" element={<HistoryPage />} />
                    <Route path="/settings" element={<SettingsPage />} />
                  </Route>
                </Route>
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </BrowserRouter>
          </UnitProvider>
        </AuthProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}
