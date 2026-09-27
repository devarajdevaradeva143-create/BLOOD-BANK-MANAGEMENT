import { Toaster } from 'react-hot-toast'
import { useTheme } from '../context/useTheme'

export default function ThemedToaster() {
  const { theme } = useTheme()
  const dark = theme === 'dark'

  return (
    <Toaster
      position="top-center"
      gutter={12}
      toastOptions={{
        style: {
          background: dark ? '#0f172a' : '#ffffff',
          color: dark ? '#f1f5f9' : '#0f172a',
          border: `1px solid ${dark ? '#1e293b' : '#e2e8f0'}`,
          borderRadius: '12px',
          fontSize: '14px',
        },
        success: {
          iconTheme: { primary: '#dc2626', secondary: '#ffffff' },
        },
        error: {
          iconTheme: { primary: '#dc2626', secondary: '#ffffff' },
        },
      }}
    />
  )
}
