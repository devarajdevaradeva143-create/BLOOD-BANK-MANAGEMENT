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
import SuperAdminMessagesPage from './pages/superadmin/MessagesPage';
import SuperAdminProfilePage from './pages/superadmin/ProfilePage';
import SuperAdminSettingsPage from './pages/superadmin/SettingsPage';
import DashboardPage from './pages/DashboardPage';
import OverviewPage from './pages/OverviewPage';
import HospitalsPage from './pages/HospitalsPage';
import BloodUnitsPage from './pages/BloodUnitsPage';
import AddUnitPage from './pages/AddUnitPage';
import TestingPage from './pages/TestingPage';
import ExpiryPage from './pages/ExpiryPage';
import HistoryPage from './pages/HistoryPage';
import DistrictRequestsPage from './pages/RequestsPage';
import DistrictDonorsPage from './pages/DonorsPage';
import DistrictDonationsPage from './pages/DonationsPage';
import DonorsMapPage from './pages/DonorsMapPage';
import DistrictReportsPage from './pages/ReportsPage';
import NotificationsPage from './pages/NotificationsPage';
import MessagesPage from './pages/MessagesPage';
import ProfilePage from './pages/ProfilePage';
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
                    <Route path="/superadmin/messages" element={<SuperAdminMessagesPage />} />
                    <Route path="/superadmin/reports" element={<ReportsPage />} />
                    <Route path="/superadmin/profile" element={<SuperAdminProfilePage />} />
                    <Route path="/superadmin/settings" element={<SuperAdminSettingsPage />} />
                  </Route>
                </Route>
                <Route element={<ProtectedRoute />}>
                  <Route element={<Layout />}>
                    <Route index element={<Navigate to="/dashboard" replace />} />
                    <Route path="/dashboard" element={<DashboardPage />} />
                    <Route path="/overview" element={<OverviewPage />} />
                    <Route path="/hospitals" element={<HospitalsPage />} />
                    <Route path="/units" element={<BloodUnitsPage />} />
                    <Route path="/units/new" element={<AddUnitPage />} />
                    <Route path="/testing" element={<TestingPage />} />
                    <Route path="/expiry" element={<ExpiryPage />} />
                    <Route path="/history" element={<HistoryPage />} />
                    <Route path="/requests" element={<DistrictRequestsPage />} />
                    <Route path="/donations" element={<DistrictDonationsPage />} />
                    <Route path="/donors" element={<DistrictDonorsPage />} />
                    <Route path="/donors-map" element={<DonorsMapPage />} />
                    <Route path="/reports" element={<DistrictReportsPage />} />
                    <Route path="/notifications" element={<NotificationsPage />} />
                    <Route path="/messages" element={<MessagesPage />} />
                    <Route path="/profile" element={<ProfilePage />} />
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
