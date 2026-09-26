import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Droplet,
  Eye,
  EyeOff,
  HeartHandshake,
  Loader2,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import s from "./DonorRegister.module.css";
import ls from "./DonorLogin.module.css";
import { useLanguage } from "../../i18n/LanguageContext";
import { TN_DISTRICTS } from "../../data/constants";
import {
  generateStrongPassword,
  getPasswordStrength,
} from "../../utils/passwordStrength";

const BENEFITS = [
  { key: "save", Icon: Droplet },
  { key: "community", Icon: Users },
  { key: "safe", Icon: ShieldCheck },
  { key: "regular", Icon: HeartHandshake },
];

export default function DonorRegister() {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    dob: "",
    gender: "",
    bloodGroup: "",
    district: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
    setError("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (
      !form.name ||
      !form.email ||
      !form.phone ||
      !form.dob ||
      !form.gender ||
      !form.bloodGroup ||
      !form.district ||
      !form.password ||
      !form.confirmPassword
    ) {
      setError(t("signup.error.allRequired"));
      return;
    }

    if (!/\S+@\S+\.\S+/.test(form.email)) {
      setError(t("signup.error.emailInvalid"));
      return;
    }

    if (!/^[0-9]{10}$/.test(form.phone)) {
      setError(t("signup.error.phoneInvalid"));
      return;
    }

    if (form.password.length < 8) {
      setError(t("signup.error.passwordLength"));
      return;
    }

    if (!/[A-Z]/.test(form.password)) {
      setError(t("signup.error.passwordUpper"));
      return;
    }

    if (!/[a-z]/.test(form.password)) {
      setError(t("signup.error.passwordLower"));
      return;
    }

    if (!/[0-9]/.test(form.password)) {
      setError(t("signup.error.passwordNumber"));
      return;
    }

    if (!/[^A-Za-z0-9]/.test(form.password)) {
      setError(t("signup.error.passwordSpecial"));
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError(t("signup.error.passwordMismatch"));
      return;
    }

    setLoading(true);

    setTimeout(() => {
      const { confirmPassword: _confirmPassword, ...registeredDonor } = form;
      try {
        localStorage.setItem("registeredDonor", JSON.stringify(registeredDonor));
      } catch {
        // ignore storage errors
      }

      setLoading(false);
      setSuccess(t("signup.success"));

      setTimeout(() => {
        navigate("/login", {
          replace: true,
          state: { registeredEmail: form.email, justRegistered: true },
        });
      }, 1200);
    }, 800);
  };

  const strength = getPasswordStrength(form.password);

  const handleSuggestPassword = () => {
    const generated = generateStrongPassword();
    setForm({
      ...form,
      password: generated,
      confirmPassword: generated,
    });
    setError("");
  };

  return (
    <div className={ls["login-page"]}>
      {/* LEFT SECTION — same blood bank details as login page */}
      <div className={ls["login-info"]}>
        <span className={ls["hero-blob-1"]} aria-hidden="true" />
        <span className={ls["hero-blob-2"]} aria-hidden="true" />
        <span className={ls["hero-blob-3"]} aria-hidden="true" />

        <div className={ls.brand}>
          <div className={ls["brand-icon"]}>
            <HeartHandshake size={28} />
          </div>
          <div>
            <h1>Life Saver</h1>
            <p>Blood Bank Management</p>
          </div>
        </div>

        <div className={ls["info-content"]}>
          <h2>{t("login.info.heading")}</h2>

          <p className={ls["info-description"]}>{t("login.info.description")}</p>

          <div className={ls.benefits}>
            {BENEFITS.map(({ key, Icon }) => (
              <div className={ls.benefit} key={key}>
                <span className={ls["benefit-icon"]}>
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

        <div className={ls["blood-illustration"]}>
          <div className={ls["blood-drop"]}>
            <Droplet />
          </div>
          <p>{t("login.illustration")}</p>
        </div>
      </div>

      {/* RIGHT SECTION — register form */}
      <div className={s["register-section"]}>
        <div className={s["register-card"]}>
          <div className={s["register-icon"]}>
            <Droplet size={28} />
          </div>

          <h2>{t("signup.title")}</h2>
          <p className={s["register-subtitle"]}>{t("signup.subtitle")}</p>

          <form onSubmit={handleSubmit}>
            <div className={s["form-row"]}>
              <div className={s["register-field"]}>
                <label htmlFor="reg-name">{t("signup.field.name")} *</label>
                <input
                  id="reg-name"
                  type="text"
                  name="name"
                  placeholder={t("signup.placeholder.name")}
                  value={form.name}
                  onChange={handleChange}
                />
              </div>

              <div className={s["register-field"]}>
                <label htmlFor="reg-email">{t("signup.field.email")} *</label>
                <input
                  id="reg-email"
                  type="email"
                  name="email"
                  placeholder={t("signup.placeholder.email")}
                  value={form.email}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className={s["form-row"]}>
              <div className={s["register-field"]}>
                <label htmlFor="reg-phone">{t("signup.field.phone")} *</label>
                <input
                  id="reg-phone"
                  type="tel"
                  name="phone"
                  placeholder={t("signup.placeholder.phone")}
                  value={form.phone}
                  maxLength={10}
                  inputMode="numeric"
                  onChange={handleChange}
                />
              </div>

              <div className={s["register-field"]}>
                <label htmlFor="reg-dob">{t("signup.field.dob")} *</label>
                <input
                  id="reg-dob"
                  type="date"
                  name="dob"
                  value={form.dob}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className={s["form-row"]}>
              <div className={s["register-field"]}>
                <label htmlFor="reg-gender">{t("signup.field.gender")} *</label>
                <select
                  id="reg-gender"
                  name="gender"
                  value={form.gender}
                  onChange={handleChange}
                >
                  <option value="">{t("signup.placeholder.gender")}</option>
                  <option value="Male">{t("signup.option.male")}</option>
                  <option value="Female">{t("signup.option.female")}</option>
                  <option value="Other">{t("signup.option.other")}</option>
                </select>
              </div>

              <div className={s["register-field"]}>
                <label htmlFor="reg-blood">
                  {t("signup.field.bloodGroup")} *
                </label>
                <select
                  id="reg-blood"
                  name="bloodGroup"
                  value={form.bloodGroup}
                  onChange={handleChange}
                >
                  <option value="">{t("signup.placeholder.bloodGroup")}</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>
            </div>

            <div className={s["register-field"]}>
              <label htmlFor="reg-district">{t("signup.field.district")} *</label>
              <select
                id="reg-district"
                name="district"
                value={form.district}
                onChange={handleChange}
              >
                <option value="">{t("signup.placeholder.district")}</option>
                {TN_DISTRICTS.map((district) => (
                  <option key={district} value={district}>
                    {district}
                  </option>
                ))}
              </select>
            </div>

            <div className={s["form-row"]}>
              <div className={s["register-field"]}>
                <label htmlFor="reg-password">
                  {t("signup.field.password")} *
                </label>
                <div className={s["password-box"]}>
                  <input
                    id="reg-password"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder={t("signup.placeholder.password")}
                    value={form.password}
                    onChange={handleChange}
                  />
                  <button
                    type="button"
                    aria-label={t("password.generate")}
                    title={t("password.generate")}
                    onClick={handleSuggestPassword}
                  >
                    <Sparkles />
                  </button>
                  <button
                    type="button"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff /> : <Eye />}
                  </button>
                </div>

                {strength && (
                  <div className={`${s["password-strength"]} ${s[strength]}`}>
                    {t("signup.strength.label")}:{" "}
                    <strong>{t(`signup.strength.${strength}`)}</strong>
                  </div>
                )}
              </div>

              <div className={s["register-field"]}>
                <label htmlFor="reg-confirm">
                  {t("signup.field.confirmPassword")} *
                </label>
                <div className={s["password-box"]}>
                  <input
                    id="reg-confirm"
                    type={showConfirm ? "text" : "password"}
                    name="confirmPassword"
                    placeholder={t("signup.placeholder.confirmPassword")}
                    value={form.confirmPassword}
                    onChange={handleChange}
                  />
                  <button
                    type="button"
                    aria-label={
                      showConfirm ? "Hide password" : "Show password"
                    }
                    onClick={() => setShowConfirm(!showConfirm)}
                  >
                    {showConfirm ? <EyeOff /> : <Eye />}
                  </button>
                </div>
              </div>
            </div>

            {error && (
              <div className={s["register-error"]} role="alert">
                {error}
              </div>
            )}

            {success && (
              <div className={s["register-success"]} role="status">
                {success}
              </div>
            )}

            <button
              type="submit"
              className={s["register-button"]}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  {t("signup.submitting")}
                </>
              ) : (
                `${t("signup.submit")} →`
              )}
            </button>
          </form>

          <div className={s["already-account"]}>
            {t("signup.already")}
            <button type="button" onClick={() => navigate("/login")}>
              {t("signup.login")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
