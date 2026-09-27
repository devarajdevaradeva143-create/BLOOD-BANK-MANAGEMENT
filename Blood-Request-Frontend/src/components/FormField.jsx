import { TriangleAlert } from 'lucide-react'

export default function FormField({ label, htmlFor, required, error, hint, children }) {
  return (
    <div className="w-full">
      <label htmlFor={htmlFor} className="label-base">
        {label}
        {required && (
          <span className="text-red-600 dark:text-red-400" aria-hidden="true">
            {' *'}
          </span>
        )}
      </label>
      <div className="relative">{children}</div>
      {error ? (
        <p className="animate-fade-in mt-1.5 flex items-center gap-1.5 text-xs font-medium text-red-600 dark:text-red-400">
          <TriangleAlert className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">{hint}</p>
      ) : null}
    </div>
  )
}
