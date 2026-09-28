import { useState } from 'react'
import toast from 'react-hot-toast'
import {
  ArrowRight,
  Building2,
  CircleAlert,
  Eye,
  EyeOff,
  HeartPulse,
  LoaderCircle,
  Lock,
  Mail,
  MapPin,
  Phone,
  Sparkles,
} from 'lucide-react'
import AuthSidePanel from '../components/AuthSidePanel'
import { useLanguage } from '../context/useLanguage'
import { registerHospital } from '../lib/auth'
import {
  generateStrongPassword,
  getPasswordStrength as getStrengthLabel,
} from '../utils/passwordStrength'

const HospitalRegister = ({ onSuccess, onLogin }) => {
  const { t } = useLanguage()
  const [form, setForm] = useState({
    hospitalName: '',
    registrationNumber: '',
    email: '',
    phone: '',
    address: '',
    password: '',
    confirmPassword: '',
  })

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    })

    setError('')
  }

  const getPasswordStrength = () => {
    const password = form.password

    if (!password) return 0

    let score = 0

    if (password.length >= 8) score++
    if (/[A-Z]/.test(password)) score++
    if (/[a-z]/.test(password)) score++
    if (/[0-9]/.test(password)) score++
    if (/[^A-Za-z0-9]/.test(password)) score++

    return score
  }

  const strengthLabel = getStrengthLabel(form.password)
  const passwordStrength =
    !form.password ? 0 : strengthLabel === 'weak' ? 2 : strengthLabel === 'medium' ? 4 : 5

  const strengthMeta =
    passwordStrength === 0
      ? null
      : passwordStrength <= 2
        ? { label: t('reg.strengthWeak'), text: 'text-red-600', bar: 'bg-red-500' }
        : passwordStrength === 3
          ? { label: t('reg.strengthFair'), text: 'text-amber-600', bar: 'bg-amber-400' }
          : passwordStrength === 4
            ? { label: t('reg.strengthGood'), text: 'text-lime-600', bar: 'bg-lime-500' }
            : { label: t('reg.strengthStrong'), text: 'text-emerald-600', bar: 'bg-emerald-500' }

  const handleGeneratePassword = () => {
    const generated = generateStrongPassword()
    setForm((f) => ({ ...f, password: generated, confirmPassword: generated }))
    setError('')
  }

  const inputCls =
    'h-9 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-[13px] text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-red-500 focus:bg-white focus:ring-4 focus:ring-red-100'
  const labelCls = 'mb-1 block text-xs font-semibold text-[#17324d]'
  const iconCls = 'pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400'

  const handleRegister = async (e) => {
    e.preventDefault()

    setError('')

    if (
      !form.hospitalName ||
      !form.registrationNumber ||
      !form.email ||
      !form.phone ||
      !form.address ||
      !form.password ||
      !form.confirmPassword
    ) {
      setError(t('reg.errAllFields'))
      return
    }

    if (!/^\S+@\S+\.\S+$/.test(form.email)) {
      setError(t('reg.errEmailInvalid'))
      return
    }

    if (!/^[0-9]{10}$/.test(form.phone)) {
      setError(t('reg.errPhone'))
      return
    }

    if (form.password.length < 8) {
      setError(t('reg.errPwLength'))
      return
    }

    if (!/[A-Z]/.test(form.password)) {
      setError(t('reg.errPwUpper'))
      return
    }

    if (!/[a-z]/.test(form.password)) {
      setError(t('reg.errPwLower'))
      return
    }

    if (!/[0-9]/.test(form.password)) {
      setError(t('reg.errPwNumber'))
      return
    }

    if (!/[^A-Za-z0-9]/.test(form.password)) {
      setError(t('reg.errPwSpecial'))
      return
    }

    if (form.password !== form.confirmPassword) {
      setError(t('reg.errPwMismatch'))
      return
    }

    setLoading(true)

    try {
      // Backend creates the account AND returns a session (auto-login).
      const { confirmPassword, ...payload } = form
      void confirmPassword
      await registerHospital(payload)
      toast.success(t('reg.toastSuccess'))
      if (onSuccess) {
        onSuccess()
      }
    } catch (err) {
      setError(err.message || t('reg.errFailed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex overflow-hidden">
      {/* ================= LEFT SECTION (same blood bank details as login) ================= */}
      <AuthSidePanel />

      {/* ================= RIGHT SECTION ================= */}
      <div className="w-full lg:w-1/2 min-h-screen flex items-center justify-center px-5 sm:px-8 py-8 overflow-y-auto">
      <div className="w-full max-w-[600px]">
        {/* Brand (side panel is hidden below lg) */}
        <div className="mb-5 flex items-center justify-center gap-3 lg:hidden">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-600 shadow-md shadow-red-200">
            <HeartPulse size={24} className="text-white" />
          </div>
          <div className="text-left">
            <p className="text-base font-bold leading-tight text-[#102a43]">Life Saver</p>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-red-600">
              Blood Bank Management
            </p>
          </div>
        </div>
          <div className="animate-fade-in-up overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_20px_60px_-15px_rgba(220,38,38,0.25)]">
            <div className="h-1.5 bg-gradient-to-r from-red-800 via-red-500 to-red-800" />

            <div className="px-5 py-5 sm:px-6">
            {/* Icon */}
            <div className="flex justify-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-red-700 shadow-lg shadow-red-200">
                <HeartPulse size={27} className="text-white" />
              </div>
            </div>

            {/* Heading */}
            <div className="mt-2 text-center">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-red-600">
                {t('reg.badge')}
              </p>
              <h2 className="mt-1 text-2xl font-bold text-[#102a43]">
                {t('reg.title')}
              </h2>
              <p className="mt-1 text-xs text-[#627b95]">
                {t('reg.subtitle')}
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleRegister} className="mt-4 space-y-3" noValidate>
              {/* Hospital Information */}
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-red-100 text-red-600">
                  <Building2 size={13} />
                </span>
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  {t('reg.hospitalInfo')}
                </h3>
                <div className="h-px flex-1 bg-slate-200" />
              </div>

              {/* Row 1 */}
              <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                {/* Hospital Name */}
                <div>
                  <label htmlFor="reg-hospital-name" className={labelCls}>
                    {t('reg.hospitalName')}
                  </label>
                  <div className="relative">
                    <Building2 size={16} className={iconCls} />
                    <input
                      id="reg-hospital-name"
                      name="hospitalName"
                      value={form.hospitalName}
                      onChange={handleChange}
                      placeholder={t('reg.phHospitalName')}
                      className={inputCls}
                    />
                  </div>
                </div>

                {/* Registration Number */}
                <div>
                  <label htmlFor="reg-number" className={labelCls}>
                    {t('reg.registrationNo')}
                  </label>
                  <input
                    id="reg-number"
                    name="registrationNumber"
                    value={form.registrationNumber}
                    onChange={handleChange}
                    placeholder={t('reg.phRegNo')}
                    className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-[13px] text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-red-500 focus:bg-white focus:ring-4 focus:ring-red-100"
                  />
                </div>
              </div>

              {/* Row 2 */}
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {/* Email */}
                <div>
                  <label htmlFor="reg-email" className={labelCls}>
                    {t('reg.email')}
                  </label>
                  <div className="relative">
                    <Mail size={16} className={iconCls} />
                    <input
                      id="reg-email"
                      type="email"
                      autoComplete="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="hospital@example.com"
                      className={inputCls}
                    />
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label htmlFor="reg-phone" className={labelCls}>
                    {t('reg.phone')}
                  </label>
                  <div className="relative">
                    <Phone size={16} className={iconCls} />
                    <input
                      id="reg-phone"
                      type="tel"
                      autoComplete="tel"
                      name="phone"
                      maxLength={10}
                      value={form.phone}
                      onChange={handleChange}
                      placeholder={t('reg.phPhone')}
                      className={inputCls}
                    />
                  </div>
                </div>
              </div>

              {/* Address */}
              <div>
                <label htmlFor="reg-address" className={labelCls}>
                  {t('reg.address')}
                </label>
                <div className="relative">
                  <MapPin size={16} className={iconCls} />
                  <input
                    id="reg-address"
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    placeholder={t('reg.phAddress')}
                    className={inputCls}
                  />
                </div>
              </div>

              {/* Account Security */}
              <div className="flex items-center gap-2 pt-1">
                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-red-100 text-red-600">
                  <Lock size={13} />
                </span>
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  {t('reg.accountSecurity')}
                </h3>
                <div className="h-px flex-1 bg-slate-200" />
              </div>

              {/* Password Row */}
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {/* Password */}
                <div>
                  <label htmlFor="reg-password" className={labelCls}>
                    {t('reg.password')}
                  </label>
                  <div className="relative">
                    <Lock size={16} className={iconCls} />
                    <input
                      id="reg-password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      name="password"
                      value={form.password}
                      onChange={handleChange}
                      placeholder={t('reg.phPassword')}
                      className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-16 text-[13px] text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-red-500 focus:bg-white focus:ring-4 focus:ring-red-100"
                    />
                    <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
                      <button
                        type="button"
                        onClick={handleGeneratePassword}
                        aria-label={t('reg.generatePassword')}
                        title={t('reg.generatePasswordTitle')}
                        className="rounded-md p-1 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                      >
                        <Sparkles size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? t('reg.hidePassword') : t('reg.showPassword')}
                        className="rounded-md p-1 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                      >
                        {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>

                  {/* Strength */}
                  {form.password ? (
                    <div className="mt-1">
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((level) => (
                          <div
                            key={level}
                            className={`h-1.5 flex-1 rounded-full transition ${
                              passwordStrength >= level ? strengthMeta.bar : 'bg-slate-200'
                            }`}
                          />
                        ))}
                      </div>
                      <p className={`mt-1 text-[11px] font-semibold ${strengthMeta.text}`}>
                        {t('reg.strengthHint').replace('{label}', strengthMeta.label)}
                      </p>
                    </div>
                  ) : (
                    <p className="mt-1.5 text-[11px] text-slate-400">
                      {t('reg.strengthEmpty')}
                    </p>
                  )}
                </div>

                {/* Confirm */}
                <div>
                  <label htmlFor="reg-confirm" className={labelCls}>
                    {t('reg.confirmPassword')}
                  </label>
                  <div className="relative">
                    <Lock size={16} className={iconCls} />
                    <input
                      id="reg-confirm"
                      type={showConfirmPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      name="confirmPassword"
                      value={form.confirmPassword}
                      onChange={handleChange}
                      placeholder={t('reg.phConfirmPassword')}
                      className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-10 text-[13px] text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-red-500 focus:bg-white focus:ring-4 focus:ring-red-100"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      aria-label={
                        showConfirmPassword ? t('reg.hidePassword') : t('reg.showPassword')
                      }
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={15} />
                      ) : (
                        <Eye size={15} />
                      )}
                    </button>
                  </div>
                  {form.confirmPassword && (
                    <p
                      className={`mt-1.5 text-[11px] font-semibold ${
                        form.password === form.confirmPassword
                          ? 'text-emerald-600'
                          : 'text-red-600'
                      }`}
                    >
                      {form.password === form.confirmPassword
                        ? t('reg.match')
                        : t('reg.notMatch')}
                    </p>
                  )}
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-700">
                  <CircleAlert size={15} className="mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Register Button */}
              <button
                type="submit"
                disabled={loading}
                className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-sm font-bold text-white shadow-lg shadow-red-600/25 transition hover:shadow-xl hover:shadow-red-600/30 hover:brightness-105 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? (
                  <>
                    <LoaderCircle size={17} className="animate-spin" />
                    {t('reg.creating')}
                  </>
                ) : (
                  <>
                    {t('reg.createAccount')}
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>

            {/* Login */}
            <div className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-center text-[13px] text-slate-600">
              {t('reg.haveAccount')}{' '}
              <button
                onClick={onLogin}
                className="font-bold text-red-600 transition hover:text-red-700 hover:underline"
              >
                {t('reg.signIn')}
              </button>
            </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HospitalRegister
