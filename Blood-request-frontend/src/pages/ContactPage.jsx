import { useState } from 'react'
import { toast } from 'react-hot-toast'
import { LoaderCircle, Mail, MapPin, Phone, Send } from 'lucide-react'
import { useLanguage } from '../context/useLanguage'
import FormField from '../components/FormField'

import PageHeader from '../components/PageHeader'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_RE = /^[6-9]\d{9}$/

const INITIAL_VALUES = { name: '', email: '', phone: '', message: '' }

export default function ContactPage() {
  const { t } = useLanguage()
  const [values, setValues] = useState(INITIAL_VALUES)
  const [errors, setErrors] = useState({})
  const [sending, setSending] = useState(false)

  function setField(name, value) {
    setValues((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[name]
        return next
      })
    }
  }

  function validate() {
    const next = {}
    const name = values.name.trim()
    if (!name) {
      next.name = t('err.required')
    } else if (name.length < 2) {
      next.name = t('err.patientName')
    }
    if (!EMAIL_RE.test(values.email.trim())) {
      next.email = t('err.emailInvalid')
    }
    const phone = values.phone.trim()
    if (phone && !PHONE_RE.test(phone)) {
      next.phone = t('err.phoneInvalid')
    }
    if (values.message.trim().length < 10) {
      next.message = t('err.messageShort')
    }
    return next
  }

  function handleSubmit(e) {
    e.preventDefault()
    const found = validate()
    setErrors(found)
    if (Object.keys(found).length > 0) return
    setSending(true)
    setTimeout(() => {
      toast.success(t('toast.contactSent'))
      setValues(INITIAL_VALUES)
      setErrors({})
      setSending(false)
    }, 800)
  }

  const infoRows = [
    {
      icon: Phone,
      label: t('contact.phoneLabel'),
      content: <a href="tel:+914440001234">{t('contact.phoneValue')}</a>,
    },
    {
      icon: Mail,
      label: t('contact.emailLabel'),
      content: (
        <a href={`mailto:${t('contact.emailValue')}`}>{t('contact.emailValue')}</a>
      ),
    },
    {
      icon: MapPin,
      label: t('contact.addressLabel'),
      content: <span>{t('contact.addressValue')}</span>,
    },
  ]

  return (
    <div>
      <PageHeader
        icon={Mail}
        title={t('contact.pageTitle')}
        description={t('contact.pageSub')}
      />
      <div className="grid gap-6 lg:grid-cols-5">
        <section className="card animate-fade-in-up p-5 sm:p-7 lg:col-span-3">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            {t('contact.formTitle')}
          </h3>
          <form onSubmit={handleSubmit} noValidate className="mt-5 space-y-5">
            <FormField
              label={t('contact.name')}
              htmlFor="contact-name"
              required
              error={errors.name}
            >
              <input
                id="contact-name"
                name="name"
                type="text"
                autoComplete="name"
                placeholder={t('contact.phName')}
                value={values.name}
                onChange={(e) => setField('name', e.target.value)}
                className={`input-base ${errors.name ? 'input-error' : ''}`}
              />
            </FormField>
            <FormField
              label={t('contact.email')}
              htmlFor="contact-email"
              required
              error={errors.email}
            >
              <input
                id="contact-email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder={t('contact.phEmail')}
                value={values.email}
                onChange={(e) => setField('email', e.target.value)}
                className={`input-base ${errors.email ? 'input-error' : ''}`}
              />
            </FormField>
            <FormField
              label={t('contact.phone')}
              htmlFor="contact-phone"
              error={errors.phone}
            >
              <input
                id="contact-phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                inputMode="numeric"
                maxLength={10}
                placeholder={t('contact.phPhone')}
                value={values.phone}
                onChange={(e) =>
                  setField('phone', e.target.value.replace(/\D/g, ''))
                }
                className={`input-base ${errors.phone ? 'input-error' : ''}`}
              />
            </FormField>
            <FormField
              label={t('contact.message')}
              htmlFor="contact-message"
              required
              error={errors.message}
            >
              <textarea
                id="contact-message"
                name="message"
                rows={5}
                placeholder={t('contact.phMessage')}
                value={values.message}
                onChange={(e) => setField('message', e.target.value)}
                className={`input-base resize-y ${errors.message ? 'input-error' : ''}`}
              />
            </FormField>
            <button
              type="submit"
              disabled={sending}
              className="btn-primary w-full sm:w-auto"
            >
              {sending ? (
                <>
                  <LoaderCircle
                    className="h-4 w-4 animate-spin"
                    aria-hidden="true"
                  />
                  {t('btn.sending')}
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" aria-hidden="true" />
                  {t('btn.send')}
                </>
              )}
            </button>
          </form>
        </section>

        <div className="space-y-5 lg:col-span-2">
          <section className="card animate-fade-in-up p-5 sm:p-7">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {t('contact.infoTitle')}
            </h3>
            <div className="mt-4 space-y-4">
              {infoRows.map((row) => (
                <div key={row.label} className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600 dark:bg-red-950/60 dark:text-red-400">
                    <row.icon className="h-4 w-4" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium tracking-wide text-slate-500 uppercase dark:text-slate-400">
                      {row.label}
                    </p>
                    <p className="mt-0.5 text-sm font-semibold text-slate-900 dark:text-white">
                      {row.content}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
          <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm dark:border-slate-700">
            <p className="flex items-center gap-2 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 dark:bg-slate-900 dark:text-white">
              <MapPin className="h-4 w-4 text-red-600 dark:text-red-400" aria-hidden="true" />
              {t('contact.mapTitle')}
            </p>
            <iframe
              title={t('contact.mapTitle')}
              src="https://www.openstreetmap.org/export/embed.html?bbox=80.24%2C13.06%2C80.30%2C13.10&layer=mapnik&marker=13.0810%2C80.2694"
              className="h-64 w-full border-0"
              loading="lazy"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
