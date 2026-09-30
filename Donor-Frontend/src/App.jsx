import { Route, Routes } from "react-router-dom";
import MainLayout from "./components/layout/MainLayout";
import RequireAuth from "./components/auth/RequireAuth";
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import AboutPage from "./pages/AboutPage";
import DonatePage from "./pages/DonatePage";
import RegisterPage from "./pages/RegisterPage";
import EligibilityPage from "./pages/EligibilityPage";
import ProcessPage from "./pages/ProcessPage";
import BenefitsPage from "./pages/BenefitsPage";
import FaqPage from "./pages/FaqPage";
import ContactPage from "./pages/ContactPage";
import ProfilePage from "./pages/ProfilePage";
import NotificationsPage from "./pages/NotificationsPage";
import NotFoundPage from "./pages/NotFoundPage";

function App() {
  return (
    <Routes>
      <Route path="login" element={<LoginPage />} />
      <Route path="register" element={<RegisterPage />} />
      <Route element={<MainLayout />}>
        <Route element={<RequireAuth />}>
          <Route index element={<HomePage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="donate" element={<DonatePage />} />
          <Route path="eligibility" element={<EligibilityPage />} />
          <Route path="process" element={<ProcessPage />} />
          <Route path="benefits" element={<BenefitsPage />} />
          <Route path="faq" element={<FaqPage />} />
          <Route path="contact" element={<ContactPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="notifications" element={<NotificationsPage />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

export default App;
