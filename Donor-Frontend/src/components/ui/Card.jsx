export default function Card({ className = "", children, ...rest }) {
  return (
    <div
      className={`rounded-xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:shadow-lg dark:hover:shadow-slate-900/50 ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}
