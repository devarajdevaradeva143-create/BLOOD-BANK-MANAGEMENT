import { Link } from 'react-router-dom'
import { MessageSquare } from 'lucide-react'
import { useLanguage } from '../context/useLanguage'

import PageHeader from '../components/PageHeader'

import Accordion from '../components/Accordion'

export default function FaqPage() {
  const { t } = useLanguage()

  const items = [
    { q: t('faq.q1'), a: t('faq.a1') },
    { q: t('faq.q2'), a: t('faq.a2') },
    { q: t('faq.q3'), a: t('faq.a3') },
    { q: t('faq.q4'), a: t('faq.a4') },
    { q: t('faq.q5'), a: t('faq.a5') },
    { q: t('faq.q6'), a: t('faq.a6') },
  ]

  return (
    <div>
      <PageHeader
        icon={MessageSquare}
        title={t('faq.pageTitle')}
        description={t('faq.pageSub')}
      />
      <Accordion items={items} defaultOpen={0} />
      <section className="card animate-fade-in-up mt-6 p-5 text-center sm:p-7">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
          {t('faq.ctaTitle')}
        </h3>
        <p className="mx-auto mt-1.5 max-w-md text-sm text-slate-500 dark:text-slate-400">
          {t('faq.ctaDesc')}
        </p>
        <Link to="/contact" className="btn-primary mt-5">
          {t('faq.ctaBtn')}
        </Link>
      </section>
    </div>
  )
}
