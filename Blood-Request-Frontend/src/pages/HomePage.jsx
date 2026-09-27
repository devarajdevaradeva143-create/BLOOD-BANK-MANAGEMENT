import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Building,
  ClipboardList,
  Droplets,
  MapPin,
  Search,
  Send,
  Siren,
} from 'lucide-react'
import { useLanguage } from '../context/useLanguage'

import MedicalIllustration from '../components/MedicalIllustration'

export default function HomePage() {
  const { t } = useLanguage()

  const quickCards = [
    {
      to: '/request',
      icon: Siren,
      title: t('home.card1Title'),
      desc: t('home.card1Desc'),
    },
    {
      to: '/availability',
      icon: MapPin,
      title: t('home.card2Title'),
      desc: t('home.card2Desc'),
    },
    {
      to: '/availability',
      icon: Droplets,
      title: t('home.card3Title'),
      desc: t('home.card3Desc'),
    },
  ]

  const steps = [
    {
      icon: ClipboardList,
      title: t('home.step1Title'),
      desc: t('home.step1Desc'),
    },
    {
      icon: Search,
      title: t('home.step2Title'),
      desc: t('home.step2Desc'),
    },
    {
      icon: Send,
      title: t('home.step3Title'),
      desc: t('home.step3Desc'),
    },
    {
      icon: Building,
      title: t('home.step4Title'),
      desc: t('home.step4Desc'),
    },
  ]

  return (
    <div className="animate-fade-in space-y-10 lg:space-y-14">
      {/* (a) Hero */}
      <section className="card relative overflow-hidden p-5 sm:p-7">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full bg-red-100/80 blur-3xl dark:bg-red-950/40"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-red-50 blur-3xl dark:bg-red-950/20"
        />
        <div className="relative grid items-center gap-8 lg:grid-cols-2">
          <div className="animate-fade-in-up">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700 dark:bg-red-950/60 dark:text-red-400">
              <Siren className="h-3.5 w-3.5" aria-hidden="true" />
              {t('home.heroBadge')}
            </span>
            <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl dark:text-white">
              {t('home.heroTitle')}
            </h1>
            <p className="mt-3 text-sm text-slate-500 sm:text-base dark:text-slate-400">
              {t('home.heroSub')}
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link to="/request" className="btn-primary">
                {t('home.heroCta')}
              </Link>
              <Link to="/availability" className="btn-secondary">
                {t('home.heroSecondary')}
              </Link>
            </div>
          </div>
          <div className="animate-fade-in-up">
            <MedicalIllustration className="mx-auto w-full max-w-md" />
          </div>
        </div>
      </section>

      {/* (b) Quick cards */}
      <section className="animate-fade-in-up">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl dark:text-white">
            {t('home.quickTitle')}
          </h2>
          <p className="mt-2 text-sm text-slate-500 sm:text-base dark:text-slate-400">
            {t('home.quickSub')}
          </p>
        </div>
        <div className="mt-6 grid gap-5 sm:grid-cols-3">
          {quickCards.map((card) => (
            <Link
              key={card.title}
              to={card.to}
              className="card p-5 transition duration-200 hover:-translate-y-1 hover:shadow-lg sm:p-6"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600 dark:bg-red-950/60 dark:text-red-400">
                <card.icon className="h-5 w-5" aria-hidden="true" />
              </div>
              <h3 className="mt-4 text-base font-semibold text-slate-900 dark:text-white">
                {card.title}
              </h3>
              <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
                {card.desc}
              </p>
              <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-red-600 dark:text-red-400">
                {t('home.learnMore')}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* (c) How it works */}
      <section className="animate-fade-in-up">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl dark:text-white">
            {t('home.stepsTitle')}
          </h2>
          <p className="mt-2 text-sm text-slate-500 sm:text-base dark:text-slate-400">
            {t('home.stepsSub')}
          </p>
        </div>
        <div className="relative mt-6">
          <div
            aria-hidden="true"
            className="hidden sm:block absolute top-5 right-8 left-8 h-0.5 bg-red-100 dark:bg-red-950"
          />
          <div className="relative grid gap-5 sm:grid-cols-4">
            {steps.map((step, i) => (
              <div key={step.title} className="card p-5 text-center sm:p-6">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-red-600 text-base font-bold text-white shadow-sm shadow-red-600/30">
                  {i + 1}
                </div>
                <div className="mx-auto mt-3 flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 text-red-600 dark:bg-red-950/60 dark:text-red-400">
                  <step.icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <h3 className="mt-3 text-sm font-semibold text-slate-900 dark:text-white">
                  {step.title}
                </h3>
                <p className="mt-1.5 text-xs text-slate-500 sm:text-sm dark:text-slate-400">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* (d) Emergency notice */}
      <section className="flex flex-col items-center justify-between gap-4 rounded-2xl bg-gradient-to-r from-red-600 to-red-700 p-6 text-white sm:flex-row sm:p-8">
        <div className="flex items-start gap-3">
          <Siren className="h-6 w-6 shrink-0" aria-hidden="true" />
          <div>
            <h3 className="text-lg font-bold">{t('home.noticeTitle')}</h3>
            <p className="mt-1 text-sm text-red-100">{t('home.noticeDesc')}</p>
          </div>
        </div>
        <Link
          to="/emergency"
          className="shrink-0 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-50"
        >
          {t('home.noticeCta')}
        </Link>
      </section>
    </div>
  )
}
