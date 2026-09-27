import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';

interface FieldProps {
  label: ReactNode;
  htmlFor?: string;
  error?: string;
  hint?: ReactNode;
  required?: boolean;
  children: ReactNode;
}

export function Field({ label, htmlFor, error, hint, required, children }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={htmlFor}
        className="block text-xs font-medium text-slate-600 dark:text-slate-300"
      >
        {label}
        {required ? <span className="ml-0.5 text-red-500">*</span> : null}
      </label>
      {children}
      {error ? (
        <p className="text-xs font-medium text-rose-600 dark:text-rose-400" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-slate-400 dark:text-slate-500">{hint}</p>
      ) : null}
    </div>
  );
}

const controlBase =
  'block w-full rounded-lg border bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm transition-colors focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500';

const controlValid = (error?: string) =>
  error
    ? 'border-rose-400 dark:border-rose-600'
    : 'border-slate-300 dark:border-slate-600';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

export function Input({ error, className = '', ...rest }: InputProps) {
  return <input className={`${controlBase} ${controlValid(error)} h-10 ${className}`} {...rest} />;
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
}

export function Textarea({ error, className = '', rows = 3, ...rest }: TextareaProps) {
  return (
    <textarea
      rows={rows}
      className={`${controlBase} ${controlValid(error)} py-2 ${className}`}
      {...rest}
    />
  );
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  error?: string;
}

export function Select({ error, className = '', children, ...rest }: SelectProps) {
  return (
    <select className={`${controlBase} ${controlValid(error)} h-10 ${className}`} {...rest}>
      {children}
    </select>
  );
}
