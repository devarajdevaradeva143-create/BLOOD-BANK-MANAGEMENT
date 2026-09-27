const variants = {
  primary:
    "bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500 shadow-sm dark:bg-brand-600 dark:hover:bg-brand-700 dark:focus-visible:ring-brand-500",
  outline:
    "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus-visible:ring-gray-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 dark:focus-visible:ring-slate-500",
  light:
    "bg-white text-red-700 hover:bg-red-50 focus-visible:ring-white shadow-sm dark:bg-slate-100 dark:text-brand-700 dark:hover:bg-white dark:focus-visible:ring-slate-300",
};

export default function Button({
  children,
  type = "button",
  onClick,
  disabled = false,
  variant = "primary",
  className = "",
  ...rest
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
