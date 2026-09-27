export default function Input({
  label,
  id,
  type = "text",
  value,
  onChange,
  error,
  placeholder,
  required = false,
  disabled = false,
  className = "",
  ...rest
}) {
  return (
    <div className={className}>
      <label
        htmlFor={id}
        className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-slate-300"
      >
        {label}
        {required && <span className="ml-0.5 text-red-600" aria-hidden="true">*</span>}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`block w-full rounded-lg border px-3.5 text-sm text-gray-900 placeholder-gray-400 shadow-sm outline-none transition-colors focus:ring-2 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500 dark:bg-slate-900 dark:text-slate-100 dark:placeholder-slate-500 dark:disabled:bg-slate-800 dark:disabled:text-slate-500 ${
          error
            ? "border-red-400 focus:border-red-500 focus:ring-red-200 dark:border-red-500 dark:focus:border-red-400 dark:focus:ring-red-900/60"
            : "border-gray-300 focus:border-red-500 focus:ring-red-200 dark:border-slate-700 dark:focus:border-brand-500 dark:focus:ring-brand-900/60"
        } h-11`}
        {...rest}
      />
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-1.5 text-xs font-medium text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
