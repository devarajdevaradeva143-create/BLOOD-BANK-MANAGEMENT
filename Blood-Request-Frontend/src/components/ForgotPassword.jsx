import { useState } from 'react'
import {
  ArrowLeft,
  CircleAlert,
  CircleCheck,
  Eye,
  EyeOff,
  Info,
  KeyRound,
  LoaderCircle,
  Lock,
  Mail,
  RotateCcw,
  Sparkles,
} from 'lucide-react'
import { useLanguage } from '../context/useLanguage'
import {
  confirmHospitalPasswordReset,
  requestHospitalPasswordReset,
} from '../lib/auth'
import {
  generateStrongPassword,
  getPasswordStrength,
} from '../utils/passwordStrength'

const inputCls =
  'h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-red-500 focus:bg-white focus:ring-4 focus:ring-red-100'
const labelCls = 'mb-1.5 block text-xs font-semibold text-[#17324d]'
const iconCls = 'pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400'

export default function ForgotPassword({ email: initialEmail, onBack }) {
  const { t } = useLanguage()

  const [step, setStep] = useState(1)
  const [email, setEmail] = useState(initialEmail || '')
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState('')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)

  const strength = getPasswordStrength(newPassword)
  const strengthMeta =
    !strength
      ? null
      : strength === 'weak'
        ? { label: 'Weak password', text: 'text-red-600', bar: 'bg-red-500' }
        : strength === 'medium'
          ? { label: 'Medium password', text: 'text-amber-600', bar: 'bg-amber-400' }
          : { label: 'Strong password', text: 'text-emerald-600', bar: 'bg-emerald-500' }
  const strengthLevel = !strength ? 0 : strength === 'weak' ? 2 : strength === 'medium' ? 4 : 5

  const handleGeneratePassword = () => {
    const generated = generateStrongPassword()
    setNewPassword(generated)
    setConfirmPassword(generated)
    setError('')
  }

  const handleSendOtp = async (e) => {
    e.preventDefault()
    setError('')
    setNote('')

    const trimmed = email.trim().toLowerCase()
    if (!trimmed) {
      setError(t('forgot.errEmailRequired'))
      return
    }
    if (!/^\S+@\S+\.\S+$/.test(trimmed)) {
      setError(t('forgot.errEmailInvalid'))
      return
    }

    setLoading(true)
    try {
      const res = await requestHospitalPasswordReset(trimmed)
      if (!res.ok) {
        if (res.reason === 'cooldown') setError(t('forgot.errCooldown'))
        else if (res.reason === 'network') setError(t('forgot.errNetwork'))
        else setError(t('forgot.errNotFound'))
        return
      }
      setEmail(trimmed)
      setNote(t('forgot.otpSent'))
      setStep(2)
    } finally {
      setLoading(false)
    }
  }

  const handleReset = async (e) => {
    e.preventDefault()
    setError('')

    if (!otp.trim()) {
      setError(t('forgot.errOtpRequired'))
      return
    }
    if (!/^\d{6}$/.test(otp.trim())) {
      setError(t('forgot.errOtpInvalid'))
      return
    }
    if (newPassword.length < 8) {
      setError(t('forgot.errPwLength'))
      return
    }
    if (!/[A-Z]/.test(newPassword)) {
      setError(t('forgot.errPwUpper'))
      return
    }
    if (!/[a-z]/.test(newPassword)) {
      setError(t('forgot.errPwLower'))
      return
    }
    if (!/[0-9]/.test(newPassword)) {
      setError(t('forgot.errPwNumber'))
      return
    }
    if (!/[^A-Za-z0-9]/.test(newPassword)) {
      setError(t('forgot.errPwSpecial'))
      return
    }
    if (newPassword !== confirmPassword) {
      setError(t('forgot.errPwMismatch'))
      return
    }

    setLoading(true)
    try {
      const res = await confirmHospitalPasswordReset({
        email,
        code: otp.trim(),
        newPassword,
      })
      if (!res.ok) {
        if (res.reason === 'cooldown') setError(t('forgot.errCooldown'))
        else if (res.reason === 'network') setError(t('forgot.errNetwork'))
        else setError(t('forgot.errOtpInvalid'))
        return
      }
      setTimeout(() => onBack(email, t('forgot.resetSuccess')), 1200)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="animate-fade-in-up overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_20px_60px_-15px_rgba(220,38,38,0.25)]">
      <div className="h-1.5 bg-gradient-to-r from-red-800 via-red-500 to-red-800" />

      <div className="px-7 py-8 sm:px-10">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-red-700 shadow-lg shadow-red-200">
            <KeyRound size={30} className="text-white" />
          </div>
        </div>

        {/* Heading */}
        <div className="mt-4 text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-red-600">
            {t('forgot.eyebrow')}
          </p>
          <h2 className="mt-1 text-2xl font-bold text-[#102a43]">{t('forgot.title')}</h2>
          <p className="mt-1 text-[13px] text-[#627b95]">{t('forgot.subtitle')}</p>
        </div>

        {/* Steps */}
        <div className="mt-5 flex items-center justify-center gap-2">
          {[1, 2].map((s) => (
            <span key={s} className="flex items-center gap-2">
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition ${
                  step === s
                    ? 'bg-red-600 text-white shadow-md shadow-red-200'
                    : step > s
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-100 text-slate-400'
                }`}
              >
                {s}
              </span>
              <span
                className={`text-xs font-semibold ${step === s ? 'text-red-700' : 'text-slate-400'}`}
              >
                {s === 1 ? t('forgot.step1') : t('forgot.step2')}
              </span>
              {s === 1 && <span className="mx-1 h-px w-8 bg-slate-200" />}
            </span>
          ))}
        </div>

        {step === 1 ? (
          <form onSubmit={handleSendOtp} className="mt-6 space-y-4" noValidate>
            <div>
              <label htmlFor="forgot-email" className={labelCls}>
                {t('forgot.emailLabel')}
              </label>
              <div className="relative">
                <Mail size={18} className={iconCls} />
                <input
                  id="forgot-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="hospital@example.com"
                  className={inputCls}
                />
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-700">
                <CircleAlert size={15} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-sm font-bold text-white shadow-lg shadow-red-600/25 transition hover:shadow-xl hover:brightness-105 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? (
                <>
                  <LoaderCircle size={18} className="animate-spin" />
                  {t('forgot.sending')}
                </>
              ) : (
                t('forgot.sendOtp')
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleReset} className="mt-6 space-y-4" noValidate>
            <div>
              <label htmlFor="forgot-otp" className={labelCls}>
                {t('forgot.otpLabel')}
              </label>
              <div className="relative">
                <KeyRound size={18} className={iconCls} />
                <input
                  id="forgot-otp"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="6-digit code"
                  className={`${inputCls} text-center font-mono text-base font-bold tracking-[0.4em]`}
                />
              </div>
            </div>

            <div className="flex items-start gap-2 rounded-xl border border-sky-200 bg-sky-50 px-3.5 py-2.5 text-xs text-sky-800">
              <Info size={15} className="mt-0.5 shrink-0" />
              <span>{t('forgot.devHint')}</span>
            </div>

            <div>
              <label htmlFor="forgot-new-password" className={labelCls}>
                {t('forgot.newLabel')}
              </label>
              <div className="relative">
                <Lock size={18} className={iconCls} />
                <input
                  id="forgot-new-password"
                  type={showNew ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  className={`${inputCls} pr-20`}
                />
                <div className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-1">
                  <button
                    type="button"
                    onClick={handleGeneratePassword}
                    aria-label="Generate strong password"
                    title="Generate strong password (fills both fields)"
                    className="rounded-md p-1 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                  >
                    <Sparkles size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    aria-label={showNew ? 'Hide password' : 'Show password'}
                    className="rounded-md p-1 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                  >
                    {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              {strengthMeta ? (
                <div className="mt-2">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <div
                        key={level}
                        className={`h-1.5 flex-1 rounded-full transition ${
                          strengthLevel >= level ? strengthMeta.bar : 'bg-slate-200'
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

            <div>
              <label htmlFor="forgot-confirm-password" className={labelCls}>
                {t('forgot.confirmLabel')}
              </label>
              <div className="relative">
                <Lock size={18} className={iconCls} />
                <input
                  id="forgot-confirm-password"
                  type={showConfirm ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat your password"
                  className={`${inputCls} pr-11`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  aria-label={showConfirm ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                >
                  {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {note && (
              <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs font-medium text-emerald-700">
                <CircleCheck size={15} className="mt-0.5 shrink-0" />
                <span>{note}</span>
              </div>
            )}
            {error && (
              <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-700">
                <CircleAlert size={15} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-sm font-bold text-white shadow-lg shadow-red-600/25 transition hover:shadow-xl hover:brightness-105 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? (
                <>
                  <LoaderCircle size={18} className="animate-spin" />
                  {t('forgot.resetting')}
                </>
              ) : (
                t('forgot.resetBtn')
              )}
            </button>

            <button
              type="button"
              onClick={handleSendOtp}
              disabled={loading}
              className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 transition hover:border-red-200 hover:text-red-600 disabled:opacity-60"
            >
              <RotateCcw size={14} />
              {t('forgot.resend')}
            </button>
          </form>
        )}

        <button
          type="button"
          onClick={() => onBack(email)}
          className="mt-5 flex w-full items-center justify-center gap-1.5 rounded-xl bg-slate-50 px-4 py-2.5 text-[13px] font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-800"
        >
          <ArrowLeft size={15} />
          {t('forgot.back')}
        </button>
      </div>
    </div>
  )
}
