export default function PageHeader({ title, subtitle, icon }) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-brand-600 to-brand-800 px-4 py-14 text-white md:py-20">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-24 left-1/4 h-72 w-72 rounded-full bg-white/10"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-1/3 top-8 h-32 w-32 rounded-full bg-white/10"
      />
      <div className="relative mx-auto flex max-w-4xl items-center gap-5">
        {icon && (
          <div className="hidden h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/15 sm:flex">
            {icon}
          </div>
        )}
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight md:text-5xl">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-3 max-w-2xl text-brand-100">{subtitle}</p>
          )}
        </div>
      </div>
    </section>
  );
}
