import { useState } from 'react'
import { KeyRound, LoaderCircle, RotateCcw, ShieldCheck, TriangleAlert, X } from 'lucide-react'

export default function OtpDialog({ contact, sending, error, onConfirm, onResend, onClose }) {
  const [code, setCode] = useState('')
  const [localError, setLocalError] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    if (!/^\d{6}$/.test(code.trim())) {
      setLocalError('Enter the 6-digit OTP sent to the contact number.')
      return
    }
    setLocalError('')
    onConfirm(code.trim())
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Verify OTP"
    >
      <div className="animate-scale-in w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-slate-900">
        <div className="h-1.5 bg-gradient-to-r from-red-800 via-red-500 to-red-800" />
        <div className="p-6 sm:p-8">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-red-700 text-white shadow-md shadow-red-200">
                <KeyRound size={22} aria-hidden="true" />
              </span>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Verify OTP</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Sent to <span className="font-semibold text-slate-700 dark:text-slate-200">{contact}</span>
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={sending}
              aria-label="Close OTP dialog"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50 dark:hover:bg-slate-800"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-4 flex items-start gap-2 rounded-xl border border-sky-200 bg-sky-50 px-3.5 py-2.5 text-xs text-sky-800 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-200">
            <ShieldCheck size={15} className="mt-0.5 shrink-0" />
            <span>Development mode: find the OTP in the backend server console ([OTP:request]).</span>
          </div>

          <form onSubmit={handleSubmit} className="mt-4 space-y-4" noValidate>
            <div>
              <label htmlFor="bulk-otp" className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-200">
                One-Time Password
              </label>
              <input
                id="bulk-otp"
                type="text"
                inputMode="numeric"
                maxLength={6}
                autoComplete="one-time-code"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.replace(/\D/g, ''))
                  setLocalError('')
                }}
                placeholder="6-digit code"
                className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 text-center font-mono text-lg font-bold tracking-[0.4em] text-slate-800 outline-none transition placeholder:text-sm placeholder:font-normal placeholder:tracking-normal placeholder:text-slate-400 focus:border-red-500 focus:bg-white focus:ring-4 focus:ring-red-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>

            {(localError || error) && (
              <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
                <TriangleAlert size={15} className="mt-0.5 shrink-0" />
                <span>{localError || error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={sending}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-sm font-bold text-white shadow-lg shadow-red-600/25 transition hover:brightness-105 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {sending ? (
                <>
                  <LoaderCircle size={18} className="animate-spin" />
                  Submitting…
                </>
              ) : (
                'Confirm & Submit Request'
              )}
            </button>

            <button
              type="button"
              onClick={onResend}
              disabled={sending}
              className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 transition hover:border-red-200 hover:text-red-600 disabled:opacity-60 dark:border-slate-700 dark:text-slate-300"
            >
              <RotateCcw size={14} />
              Resend OTP
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
