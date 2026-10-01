import { GoogleMap, MarkerF, useJsApiLoader } from '@react-google-maps/api'
import { useLanguage } from '../context/useLanguage'
import { OFFICE_CENTER, OFFICE_ZOOM } from '../lib/mapProvider'

export default function ContactMap({ heightClass = 'h-64' }) {
  const { t } = useLanguage()
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_KEY
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'contact-gmap',
    googleMapsApiKey: apiKey ?? '',
  })

  if (!apiKey) {
    return (
      <div className="flex w-full flex-col items-center gap-2 bg-slate-50 px-6 py-12 text-center dark:bg-slate-900">
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
          {t('map.keyMissingTitle')}
        </p>
        <p className="max-w-md text-xs text-slate-500 dark:text-slate-400">
          {t('map.keyMissing')}
        </p>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="flex w-full items-center justify-center bg-slate-50 px-6 py-12 text-center dark:bg-slate-900">
        <p className="text-sm text-slate-500">
          {String(loadError.message || loadError)}
        </p>
      </div>
    )
  }

  if (!isLoaded) {
    return (
      <div className="flex w-full items-center justify-center gap-2 bg-slate-50 px-6 py-12 dark:bg-slate-900">
        <span className="text-sm text-slate-500">{t('map.googleLoading')}</span>
      </div>
    )
  }

  return (
    <GoogleMap
      mapContainerClassName={`w-full ${heightClass}`}
      center={OFFICE_CENTER}
      zoom={OFFICE_ZOOM}
    >
      <MarkerF position={OFFICE_CENTER} title={t('contact.mapTitle')} />
    </GoogleMap>
  )
}
