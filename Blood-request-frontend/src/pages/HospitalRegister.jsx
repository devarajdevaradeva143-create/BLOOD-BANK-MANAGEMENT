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
} from 'lucide-react'
import AuthSidePanel from '../components/AuthSidePanel'
import { registerHospital } from '../lib/auth'

const HospitalRegister = ({ onSuccess, onLogin }) => {
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

  const passwordStrength = getPasswordStrength()

  const strengthMeta =
    passwordStrength === 0
      ? null
      : passwordStrength <= 2
        ? { label: 'Weak password', text: 'text-red-600', bar: 'bg-red-500' }
        : passwordStrength === 3
          ? { label: 'Fair password', text: 'text-amber-600', bar: 'bg-amber-400' }
          : passwordStrength === 4
            ? { label: 'Good password', text: 'text-lime-600', bar: 'bg-lime-500' }
            : { label: 'Strong password', text: 'text-emerald-600', bar: 'bg-emerald-500' }

  const inputCls =
    'h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-[13px] text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-red-500 focus:bg-white focus:ring-4 focus:ring-red-100'
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
      setError('Please fill in all fields.')
      return
    }

    if (!/^\S+@\S+\.\S+$/.test(form.email)) {
      setError('Please enter a valid email address.')
      return
    }

    if (!/^[0-9]{10}$/.test(form.phone)) {
      setError('Phone number must contain 10 digits.')
      return
    }

    if (form.password.length < 8) {
      setError('Password must contain at least 8 characters.')
      return
    }

    if (!/[A-Z]/.test(form.password)) {
      setError('Password must contain at least one uppercase letter.')
      return
    }

    if (!/[a-z]/.test(form.password)) {
      setError('Password must contain at least one lowercase letter.')
      return
    }

    if (!/[0-9]/.test(form.password)) {
      setError('Password must contain at least one number.')
      return
    }

    if (!/[^A-Za-z0-9]/.test(form.password)) {
      setError('Password must contain at least one special character.')
      return
    }

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)

    try {
      // Backend creates the account AND returns a session (auto-login).
      const { confirmPassword, ...payload } = form
      void confirmPassword
      await registerHospital(payload)
      toast.success('Registration successful!')
      if (onSuccess) {
        onSuccess()
      }
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.')
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

            <div className="px-6 py-7 sm:px-8">
            {/* Icon */}
            <div className="flex justify-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-red-700 shadow-lg shadow-red-200">
                <HeartPulse size={27} className="text-white" />
              </div>
            </div>

            {/* Heading */}
            <div className="mt-3 text-center">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-red-600">
                Join the network
              </p>
              <h2 className="mt-1 text-2xl font-bold text-[#102a43]">
                Hospital Registration
              </h2>
              <p className="mt-1 text-xs text-[#627b95]">
                Create your hospital account to request blood units
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleRegister} className="mt-6 space-y-5" noValidate>
              {/* Hospital Information */}
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-red-100 text-red-600">
                  <Building2 size={13} />
                </span>
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  Hospital Information
                </h3>
                <div className="h-px flex-1 bg-slate-200" />
              </div>

              {/* Row 1 */}
              <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                {/* Hospital Name */}
                <div>
                  <label htmlFor="reg-hospital-name" className={labelCls}>
                    Hospital Name
                  </label>
                  <div className="relative">
                    <Building2 size={16} className={iconCls} />
                    <input
                      id="reg-hospital-name"
                      name="hospitalName"
                      value={form.hospitalName}
                      onChange={handleChange}
                      placeholder="e.g. Govt. General Hospital"
                      className={inputCls}
                    />
                  </div>
                </div>

                {/* Registration Number */}
                <div>
                  <label htmlFor="reg-number" className={labelCls}>
                    Registration No.
                  </label>
                  <input
                    id="reg-number"
                    name="registrationNumber"
                    value={form.registrationNumber}
                    onChange={handleChange}
                    placeholder="e.g. TN-REG-12345"
                    className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-[13px] text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-red-500 focus:bg-white focus:ring-4 focus:ring-red-100"
                  />
                </div>
              </div>

              {/* Row 2 */}
              <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                {/* Email */}
                <div>
                  <label htmlFor="reg-email" className={labelCls}>
                    Email Address
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
                    Phone Number
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
                      placeholder="10-digit mobile number"
                      className={inputCls}
                    />
                  </div>
                </div>
              </div>

              {/* Address */}
              <div>
                <label htmlFor="reg-address" className={labelCls}>
                  Hospital Address
                </label>
                <div className="relative">
                  <MapPin size={16} className={iconCls} />
                  <input
                    id="reg-address"
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    placeholder="Street, area, district"
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
                  Account Security
                </h3>
                <div className="h-px flex-1 bg-slate-200" />
              </div>

              {/* Password Row */}
              <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                {/* Password */}
                <div>
                  <label htmlFor="reg-password" className={labelCls}>
                    Password
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
                      placeholder="Min. 8 characters"
                      className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-10 text-[13px] text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-red-500 focus:bg-white focus:ring-4 focus:ring-red-100"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>

                  {/* Strength */}
                  {form.password ? (
                    <div className="mt-2">
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
                        {strengthMeta.label} — use uppercase, number &amp; symbol
                      </p>
                    </div>
                  ) : (
                    <p className="mt-1.5 text-[11px] text-slate-400">
                      Use 8+ characters with uppercase, number &amp; symbol
                    </p>
                  )}
                </div>

                {/* Confirm */}
                <div>
                  <label htmlFor="reg-confirm" className={labelCls}>
                    Confirm Password
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
                      placeholder="Repeat your password"
                      className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-10 text-[13px] text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-red-500 focus:bg-white focus:ring-4 focus:ring-red-100"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
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
                        ? 'Passwords match'
                        : 'Passwords do not match'}
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
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-sm font-bold text-white shadow-lg shadow-red-600/25 transition hover:shadow-xl hover:shadow-red-600/30 hover:brightness-105 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? (
                  <>
                    <LoaderCircle size={17} className="animate-spin" />
                    Creating account…
                  </>
                ) : (
                  <>
                    Create Account
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>

            {/* Login */}
            <div className="mt-5 rounded-xl bg-slate-50 px-4 py-3 text-center text-[13px] text-slate-600">
              Already have an account?{' '}
              <button
                onClick={onLogin}
                className="font-bold text-red-600 transition hover:text-red-700 hover:underline"
              >
                Sign in
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
