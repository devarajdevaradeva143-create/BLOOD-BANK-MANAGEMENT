import { useState } from 'react'
import toast from 'react-hot-toast'
import {
  ArrowRight,
  CircleAlert,
  Eye,
  EyeOff,
  HeartPulse,
  LoaderCircle,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import AuthSidePanel from '../components/AuthSidePanel'
import ForgotPassword from '../components/ForgotPassword'
import { demoLogin, getRememberedEmail, loginUser, setRememberedEmail } from '../lib/auth'

const HospitalLogin = ({ onLogin, onRegister }) => {
  const [view, setView] = useState('login')
  const [email, setEmail] = useState(getRememberedEmail)
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(() => getRememberedEmail() !== '')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setNotice('')

    if (!email || !password) {
      setError('Please enter your email and password.')
      return
    }

    setLoading(true)
    try {
      await loginUser({ email, password })
      setRememberedEmail(email, remember)
      toast.success('Logged in successfully!')
      if (onLogin) {
        onLogin()
      }
    } catch (err) {
      setError(err.message || 'Invalid email or password.')
    } finally {
      setLoading(false)
    }
  }

  const handleDemoLogin = async () => {
    setError('')
    setNotice('')
    setLoading(true)
    try {
      await demoLogin()
      toast.success('Logged in with demo account!')
      if (onLogin) {
        onLogin()
      }
    } catch (err) {
      setError(err.message || 'Demo login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleForgotBack = (returnedEmail, successMessage) => {
    if (returnedEmail) setEmail(returnedEmail)
    if (successMessage) {
      setNotice(successMessage)
      toast.success(successMessage)
    }
    setError('')
    setView('login')
  }

  return (
    <div className="min-h-screen bg-white flex overflow-hidden">
      {/* ================= LEFT SECTION (shared blood bank details) ================= */}
      <AuthSidePanel />

      {/* ================= RIGHT SECTION ================= */}
      <div className="w-full lg:w-1/2 min-h-screen flex items-center justify-center px-6 py-10 bg-white">
        <div className="w-full max-w-[500px]">
          {/* Mobile brand (side panel is hidden below lg) */}
          <div className="mb-6 flex items-center justify-center gap-3 lg:hidden">
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
          {/* Login / Forgot Card */}
          {view === 'forgot' ? (
            <ForgotPassword email={email} onBack={handleForgotBack} />
          ) : (
          <div className="animate-fade-in-up overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_20px_60px_-15px_rgba(220,38,38,0.25)]">
            <div className="h-1.5 bg-gradient-to-r from-red-800 via-red-500 to-red-800" />

            <div className="px-7 py-8 sm:px-10">
              {/* Icon */}
              <div className="flex justify-center">
                <div className="relative">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-red-700 shadow-lg shadow-red-200">
                    <HeartPulse size={30} className="text-white" />
                  </div>
                  <span className="absolute -bottom-1.5 -right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-white">
                    <ShieldCheck size={13} className="text-white" />
                  </span>
                </div>
              </div>

              {/* Heading */}
              <div className="mt-4 text-center">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-red-600">
                  Welcome back
                </p>
                <h2 className="mt-1 text-2xl font-bold text-[#102a43]">
                  Hospital Login
                </h2>
                <p className="mt-1 text-[13px] text-[#627b95]">
                  Sign in to manage blood requests for your hospital
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleLogin} className="mt-7 space-y-4" noValidate>
                {/* Email */}
                <div>
                  <label
                    htmlFor="login-email"
                    className="mb-1.5 block text-xs font-semibold text-[#17324d]"
                  >
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail
                      size={18}
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      id="login-email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="hospital@example.com"
                      className={`h-11 w-full rounded-xl border bg-slate-50 pl-11 pr-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-red-500 focus:bg-white focus:ring-4 focus:ring-red-100 ${
                        error ? 'border-red-300' : 'border-slate-200'
                      }`}
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label
                    htmlFor="login-password"
                    className="mb-1.5 block text-xs font-semibold text-[#17324d]"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <Lock
                      size={18}
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className={`h-11 w-full rounded-xl border bg-slate-50 pl-11 pr-11 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-red-500 focus:bg-white focus:ring-4 focus:ring-red-100 ${
                        error ? 'border-red-300' : 'border-slate-200'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* Remember + Forgot */}
                <div className="flex items-center justify-between">
                  <label className="flex cursor-pointer select-none items-center gap-2 text-xs font-medium text-slate-600">
                    <input
                      type="checkbox"
                      checked={remember}
                      onChange={(e) => setRemember(e.target.checked)}
                      className="h-4 w-4 rounded accent-red-600"
                    />
                    Remember me
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setError('')
                      setNotice('')
                      setView('forgot')
                    }}
                    className="text-xs font-semibold text-red-600 transition hover:text-red-700 hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>

                {/* Success notice (e.g. after password reset) */}
                {notice && (
                  <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs font-medium text-emerald-700">
                    <ShieldCheck size={15} className="mt-0.5 shrink-0" />
                    <span>{notice}</span>
                  </div>
                )}

                {/* Error */}
                {error && (
                  <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-700">
                    <CircleAlert size={15} className="mt-0.5 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Login */}
                <button
                  type="submit"
                  disabled={loading}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-sm font-bold text-white shadow-lg shadow-red-600/25 transition hover:shadow-xl hover:shadow-red-600/30 hover:brightness-105 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loading ? (
                    <>
                      <LoaderCircle size={18} className="animate-spin" />
                      Signing in…
                    </>
                  ) : (
                    <>
                      Sign In
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </form>

              {/* Divider */}
              <div className="my-5 flex items-center gap-3">
                <div className="h-px flex-1 bg-slate-200" />
                <span className="rounded-full bg-slate-100 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  or
                </span>
                <div className="h-px flex-1 bg-slate-200" />
              </div>

              {/* Demo Login */}
              <button
                type="button"
                onClick={handleDemoLogin}
                disabled={loading}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-red-200 bg-red-50/60 text-sm font-semibold text-red-700 transition hover:border-red-300 hover:bg-red-50 disabled:opacity-60"
              >
                <Sparkles size={17} />
                Explore Demo Account
              </button>
              <p className="mt-2.5 text-center">
                <code className="rounded-md bg-slate-100 px-2.5 py-1 font-mono text-[11px] text-slate-600">
                  demo@hospital.com / Demo@1234
                </code>
              </p>

              {/* Register */}
              <div className="mt-6 rounded-xl bg-slate-50 px-4 py-3 text-center text-[13px] text-slate-600">
                New hospital?{' '}
                <button
                  onClick={onRegister}
                  className="font-bold text-red-600 transition hover:text-red-700 hover:underline"
                >
                  Register here
                </button>
              </div>
            </div>
          </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default HospitalLogin
