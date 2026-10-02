import { useState } from "react";
import { KeyRound, Loader2, X } from "lucide-react";
import Button from "../ui/Button";

export default function DonationOtpDialog({
  open,
  mobile,
  email,
  title = "Verify OTP",
  description = "",
  verifying = false,
  resending = false,
  error = "",
  onVerify,
  onResend,
  onClose,
}) {
  const [code, setCode] = useState("");
  const [localError, setLocalError] = useState("");
  const [wasOpen, setWasOpen] = useState(open);

  // Reset the code field each time the dialog is (re)opened.
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setCode("");
      setLocalError("");
    }
  }

  if (!open) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = code.trim();
    if (!/^\d{6}$/.test(trimmed)) {
      setLocalError(
        email
          ? "Please enter the 6-digit OTP sent to your email."
          : "Please enter the 6-digit OTP sent to your mobile."
      );
      return;
    }
    setLocalError("");
    onVerify(trimmed);
  };

  const shownError = localError || error;
  const contactLabel = email ? String(email) : mobile ? `+91 ${mobile}` : "";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="donation-otp-title"
    >
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-900 sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400">
            <KeyRound className="h-5 w-5" />
          </span>
          <button
            type="button"
            onClick={onClose}
            disabled={verifying}
            aria-label="Close OTP dialog"
            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-slate-800 dark:hover:text-slate-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <h2
          id="donation-otp-title"
          className="mt-4 text-lg font-bold text-gray-900 dark:text-white"
        >
          {title}
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
          {description ? (
            <>
              {description} {contactLabel}.
            </>
          ) : (
            <>
              We sent a 6-digit code to {contactLabel || "your email"}. Enter it below to confirm
              your donation request.
            </>
          )}
        </p>

        <form onSubmit={handleSubmit} className="mt-5">
          <label
            htmlFor="donation-otp"
            className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-slate-300"
          >
            6-digit OTP
          </label>
          <input
            id="donation-otp"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={code}
            onChange={(e) =>
              setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
            }
            placeholder="Enter 6-digit OTP"
            disabled={verifying}
            aria-invalid={shownError ? "true" : undefined}
            className={`block h-12 w-full rounded-lg border bg-white px-3.5 text-center text-lg font-bold tracking-[0.5em] text-gray-900 shadow-sm outline-none transition-colors focus:ring-2 disabled:cursor-not-allowed disabled:bg-gray-100 dark:bg-slate-900 dark:text-slate-100 dark:disabled:bg-slate-800 ${
              shownError
                ? "border-red-400 focus:border-red-500 focus:ring-red-200 dark:border-red-500 dark:focus:ring-red-900/60"
                : "border-gray-300 focus:border-red-500 focus:ring-red-200 dark:border-slate-700 dark:focus:border-brand-500 dark:focus:ring-brand-900/60"
            }`}
          />
          {shownError && (
            <p
              role="alert"
              className="mt-1.5 text-xs font-medium text-red-600 dark:text-red-400"
            >
              {shownError}
            </p>
          )}

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Button
              type="submit"
              variant="primary"
              disabled={verifying || code.trim().length !== 6}
              className="flex-1 px-4 py-2.5"
            >
              {verifying && <Loader2 className="h-4 w-4 animate-spin" />}
              {verifying ? "Verifying..." : "Verify & Submit"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onResend}
              disabled={verifying || resending}
              className="px-4 py-2.5"
            >
              {resending && <Loader2 className="h-4 w-4 animate-spin" />}
              {resending ? "Sending..." : "Resend OTP"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
