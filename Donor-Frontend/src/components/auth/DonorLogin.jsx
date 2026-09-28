import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Droplet,
  Eye,
  EyeOff,
  HeartHandshake,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  Users,
} from "lucide-react";
import s from "./DonorLogin.module.css";
import ForgotPassword from "./ForgotPassword";
import { useDonorAuth } from "../../context/DonorAuthContext";
import { useLanguage } from "../../i18n/LanguageContext";

const DEMO_DONOR = { email: "demo@lifesaver.com", password: "demo123" };
// Demo login is TEMPORARY — VITE_ENABLE_DEMO=false sets it off in one step.
const DEMO_ENABLED = import.meta.env.VITE_ENABLE_DEMO !== "false";

const BENEFITS = [
  { key: "save", Icon: Droplet },
  { key: "community", Icon: Users },
  { key: "safe", Icon: ShieldCheck },
  { key: "regular", Icon: HeartHandshake },
];

export default function DonorLogin() {
  const { login } = useDonorAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState(
    () => location.state?.registeredEmail ?? ""
  );
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [note, setNote] = useState(() =>
    location.state?.justRegistered ? t("login.registered.success") : ""
  );
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState("login");

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    setNote("");

    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail) {
      setError(t("login.error.emailRequired"));
      return;
    }
    if (!/\S+@\S+\.\S+/.test(trimmedEmail)) {
      setError(t("login.error.emailInvalid"));
      return;
    }
    if (!password) {
      setError(t("login.error.passwordRequired"));
      return;
    }

    setLoading(true);

    setTimeout(() => {
      const matchesDemo =
        DEMO_ENABLED &&
        trimmedEmail === DEMO_DONOR.email && password === DEMO_DONOR.password;

      if (matchesDemo) {
        login(trimmedEmail, true);
        const from = location.state?.from?.pathname ?? "/";
        navigate(from, { replace: true });
      } else {
        setError(t("login.error.invalid"));
      }

      setLoading(false);
    }, 600);
  };

  const handleForgotPassword = () => {
    setError("");
    setNote("");
    setView("forgot");
  };

  const handleForgotBack = (emailUsed = "", message = "") => {
    setView("login");
    if (emailUsed) setEmail(emailUsed);
    setError("");
    setNote(message);
  };

  const handleRegister = () => {
    navigate("/register");
  };

  const handleDemoLogin = () => {
    if (!DEMO_ENABLED) return;
    setEmail(DEMO_DONOR.email);
    setPassword(DEMO_DONOR.password);
    setError("");
    setNote("");
  };

  return (
    <div className={s["login-page"]}>
      {/* LEFT SECTION */}
      <div className={s["login-info"]}>
        <span className={s["hero-blob-1"]} aria-hidden="true" />
        <span className={s["hero-blob-2"]} aria-hidden="true" />
        <span className={s["hero-blob-3"]} aria-hidden="true" />

        <div className={s.brand}>
          <div className={s["brand-icon"]}>
            <HeartHandshake size={28} />
          </div>
          <div>
            <h1>Life Saver</h1>
            <p>Blood Bank Management</p>
          </div>
        </div>

        <div className={s["info-content"]}>
          <h2>{t("login.info.heading")}</h2>

          <p className={s["info-description"]}>{t("login.info.description")}</p>

          <div className={s.benefits}>
            {BENEFITS.map(({ key, Icon }) => (
              <div className={s.benefit} key={key}>
                <span className={s["benefit-icon"]}>
                  <Icon />
                </span>
                <div>
                  <h3>{t(`login.benefit.${key}.title`)}</h3>
                  <p>{t(`login.benefit.${key}.text`)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={s["blood-illustration"]}>
          <div className={s["blood-drop"]}>
            <Droplet />
          </div>
          <p>{t("login.illustration")}</p>
        </div>
      </div>

      {/* RIGHT SECTION */}
      <div className={s["login-section"]}>
        <div className={s["login-card"]}>
          <div className={s["login-icon"]}>
            <Droplet size={32} />
          </div>

          {view === "forgot" ? (
            <ForgotPassword email={email} onBack={handleForgotBack} />
          ) : (
            <>
              <h2>{t("login.title")}</h2>
              <p className={s["login-subtitle"]}>{t("login.subtitle")}</p>

              <form onSubmit={handleSubmit}>
            {/* EMAIL */}
            <div className={s["form-group"]}>
              <label htmlFor="login-email">{t("login.email")}</label>
              <div className={s["input-wrapper"]}>
                <span className={s["input-icon"]}>
                  <Mail />
                </span>
                <input
                  id="login-email"
                  type="email"
                  placeholder={t("login.emailPlaceholder")}
                  value={email}
                  autoComplete="email"
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {/* PASSWORD */}
            <div className={s["form-group"]}>
              <label htmlFor="login-password">{t("login.password")}</label>
              <div className={s["input-wrapper"]}>
                <span className={s["input-icon"]}>
                  <Lock />
                </span>
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  placeholder={t("login.passwordPlaceholder")}
                  value={password}
                  autoComplete="current-password"
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className={s["password-toggle"]}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword((v) => !v)}
                >
                  {showPassword ? <EyeOff /> : <Eye />}
                </button>
              </div>
            </div>

            {/* FORGOT PASSWORD */}
            <div className={s["forgot-container"]}>
              <button
                type="button"
                className={s["forgot-password"]}
                onClick={handleForgotPassword}
              >
                {t("login.forgot")}
              </button>
            </div>

            {/* ERROR / NOTE */}
            {error && (
              <div className={s["error-message"]} role="alert">
                {error}
              </div>
            )}
            {note && !error && (
              <div className={s["info-message"]} role="status">
                {note}
              </div>
            )}

            {/* LOGIN BUTTON */}
            <button type="submit" className={s["login-button"]} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  {t("login.submitting")}
                </>
              ) : (
                `${t("login.submit")} →`
              )}
            </button>
          </form>

          {DEMO_ENABLED && (
          <div className={s["demo-hint"]}>
            <span>{t("login.demo.label")}: {t("login.demo.value")} (Demo Mode — no real data)</span>
            <button type="button" className={s["demo-login-btn"]} onClick={handleDemoLogin}>
              {t("login.demo.autofill")}
            </button>
          </div>
          )}

          <div className={s["or-divider"]}>
            <span></span>
            <p>{t("login.or")}</p>
            <span></span>
          </div>

          {/* REGISTER */}
          <p className={s["register-text"]}>
            {t("login.noAccount")}{" "}
            <button
              type="button"
              onClick={handleRegister}
              className={s["register-link"]}
            >
              {t("login.register")}
            </button>
          </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
