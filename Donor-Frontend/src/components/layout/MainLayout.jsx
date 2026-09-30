import Navbar from "../Navbar";
import Toast from "../Toast";
import ScrollToTop from "../ScrollToTop";
import Footer from "../Footer";
import ChatWidget from "../chat/ChatWidget";
import { Outlet } from "react-router-dom";

export default function MainLayout() {
  return (
    <>
      <ScrollToTop />
      <Navbar />
      <div id="app-scroll" className="app-scroll">
        <main className="min-h-screen pt-16">
          <Outlet />
        </main>
        <Footer />
      </div>
      <Toast />
      <ChatWidget />
    </>
  );
}
