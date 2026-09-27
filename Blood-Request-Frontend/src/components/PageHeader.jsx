export default function PageHeader({ icon: Icon, title, description }) {
  return (
    <div className="mb-8 text-center lg:mb-10 animate-fade-in">
      <div className="mx-auto max-w-2xl">
        {Icon && (
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-600 text-white shadow-lg shadow-red-600/25">
            <Icon className="h-6 w-6" aria-hidden="true" />
          </div>
        )}
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
          {title}
        </h1>
        {description && (
          <p className="mt-2 text-sm text-slate-500 sm:text-base dark:text-slate-400">
            {description}
          </p>
        )}
      </div>
    </div>
  )
}
