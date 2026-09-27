export default function Checkbox({
  label,
  id,
  checked,
  onChange,
  error,
  className = "",
}) {
  return (
    <div className={className}>
      <label
        htmlFor={id}
        className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3.5 transition-colors ${
          error
            ? "border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950/50"
            : checked
              ? "border-red-200 bg-red-50 dark:border-brand-800 dark:bg-brand-900/30"
              : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-slate-600 dark:hover:bg-slate-800"
        }`}
      >
        <input
          id={id}
          name={id}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          aria-invalid={error ? "true" : undefined}
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300 text-red-600 focus:ring-red-500 dark:border-slate-600 dark:bg-slate-800 dark:checked:border-brand-500 dark:checked:bg-brand-600"
        />
        <span className="text-sm leading-relaxed text-gray-700 dark:text-slate-300">
          {label}
        </span>
      </label>
      {error && (
        <p role="alert" className="mt-1.5 text-xs font-medium text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
