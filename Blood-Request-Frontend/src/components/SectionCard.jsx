export default function SectionCard({ step, icon: Icon, title, description, children, id }) {
  return (
    <section id={id} className="card animate-fade-in-up scroll-mt-24 p-5 sm:p-7">
      <div className="flex items-start gap-3 sm:gap-4">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-600 text-sm font-bold text-white shadow-sm shadow-red-600/30">
          {step}
        </div>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-50 p-2 text-red-600 dark:bg-red-950/60 dark:text-red-400">
          <Icon className="h-full w-full" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white sm:text-lg">
            {title}
          </h2>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{description}</p>
        </div>
      </div>
      <div className="mt-5 sm:mt-6">{children}</div>
    </section>
  )
}
