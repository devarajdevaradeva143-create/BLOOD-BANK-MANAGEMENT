import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App.jsx";
import { ThemeProvider } from "./context/ThemeContext";
import { ToastProvider } from "./context/ToastContext";
import { DonorAuthProvider } from "./context/DonorAuthContext";
import { LanguageProvider } from "./i18n/LanguageContext";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <LanguageProvider>
      <ThemeProvider>
        <ToastProvider>
          <DonorAuthProvider>
            <BrowserRouter>
              <App />
            </BrowserRouter>
          </DonorAuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </LanguageProvider>
  </StrictMode>
);
