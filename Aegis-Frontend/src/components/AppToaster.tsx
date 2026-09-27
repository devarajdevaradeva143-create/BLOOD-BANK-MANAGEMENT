import { Toaster } from 'react-hot-toast';

export function AppToaster() {
  return (
    <Toaster
      position="top-right"
      reverseOrder={false}
      gutter={8}
      containerStyle={{ top: 16, right: 16 }}
      toastOptions={{
        duration: 4000,
        removeDelay: 1000,
        className:
          'rounded-xl border px-4 py-3 text-sm font-medium shadow-lg !border-slate-200 !bg-white !text-slate-900 dark:!border-slate-700 dark:!bg-slate-800 dark:!text-slate-100',
        success: {
          duration: 3000,
          iconTheme: { primary: '#dc2626', secondary: '#ffffff' },
          className: '!border-red-200 !text-red-700 dark:!border-red-900 dark:!text-red-300',
        },
        error: {
          iconTheme: { primary: '#dc2626', secondary: '#ffffff' },
          className: '!border-red-300 !text-red-700 dark:!border-red-900 dark:!text-red-300',
        },
        loading: { iconTheme: { primary: '#64748b', secondary: '#ffffff' } },
      }}
    />
  );
}
