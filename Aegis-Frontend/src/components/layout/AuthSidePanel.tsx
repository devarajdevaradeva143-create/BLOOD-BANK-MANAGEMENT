import type { LucideIcon } from 'lucide-react';
import { BadgeCheck, Droplet, MapPin, PhoneCall, ShieldCheck } from 'lucide-react';

export interface SideStat {
  icon: LucideIcon;
  value: string;
  label: string;
}

interface AuthSidePanelProps {
  eyebrow: string;
  orgName: string;
  orgSub: string;
  headline: string;
  description: string;
  stats: SideStat[];
  features: string[];
  helplineLabel: string;
  helplineValue: string;
  location: string;
  secureNote: string;
  gradientClass?: string;
  isLoading?: boolean;
}

export default function AuthSidePanel({
  eyebrow,
  orgName,
  orgSub,
  headline,
  description,
  stats,
  features,
  helplineLabel,
  helplineValue,
  location,
  secureNote,
  gradientClass = 'from-red-950 via-red-800 to-rose-950',
  isLoading = false,
}: AuthSidePanelProps) {
  return (
    <div
      className={`relative hidden w-full overflow-hidden bg-gradient-to-br ${gradientClass} lg:flex lg:min-h-screen lg:w-[52%] lg:items-center lg:justify-center lg:p-10 xl:p-14`}
    >
      {/* premium décor */}
      <div
        className="pointer-events-none absolute -right-28 -top-28 h-[26rem] w-[26rem] rounded-full bg-rose-400/20 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-36 -left-20 h-[28rem] w-[28rem] rounded-full bg-black/40 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute left-1/2 top-1/3 h-72 w-72 -translate-x-1/2 rounded-full bg-red-500/20 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 opacity-[0.14]"
        aria-hidden="true"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
          backgroundSize: '22px 22px',
        }}
      />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-white/10 to-transparent"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black/40 to-transparent"
        aria-hidden="true"
      />

      <div className="relative w-full max-w-md py-6">
        {/* org header */}
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-red-700 shadow-xl shadow-black/25 ring-1 ring-white/40">
            <Droplet className="h-6 w-6" fill="currentColor" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-[17px] font-bold leading-tight tracking-tight text-white">
              {orgName}
            </p>
            <p className="truncate text-xs font-medium tracking-wide text-red-100/90">{orgSub}</p>
          </div>
          <span className="ml-auto hidden shrink-0 items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-white ring-1 ring-white/25 backdrop-blur-md sm:inline-flex">
            <BadgeCheck className="h-3.5 w-3.5 text-emerald-300" />
            TN Govt
          </span>
        </div>

        {/* headline */}
        <div className="mt-8">
          <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-red-200/90">
            <span className="h-px w-6 bg-red-300/60" aria-hidden="true" />
            {eyebrow}
          </p>
          <h1 className="mt-3 text-[26px] font-bold leading-[1.25] tracking-tight text-white">
            {headline}
          </h1>
          <p className="mt-2.5 text-sm leading-relaxed text-red-50/85">{description}</p>
        </div>

        {/* stats */}
        <div className="mt-7 grid grid-cols-2 gap-3" aria-live="polite">
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="animate-pulse rounded-2xl bg-white/10 p-3.5 ring-1 ring-white/15 backdrop-blur-md"
                >
                  <div className="h-4 w-4 rounded bg-white/20" />
                  <div className="mt-3 h-4 w-16 rounded bg-white/25" />
                  <div className="mt-2 h-3 w-20 rounded bg-white/15" />
                </div>
              ))
            : stats.map((s) => (
                <div
                  key={s.label}
                  className="group rounded-2xl bg-white/[0.09] p-3.5 ring-1 ring-white/15 backdrop-blur-md transition duration-200 hover:-translate-y-0.5 hover:bg-white/[0.14] hover:ring-white/25 hover:shadow-lg hover:shadow-black/20"
                >
                  <s.icon className="h-4 w-4 text-red-100" />
                  <p className="mt-2.5 text-[17px] font-bold leading-none tracking-tight text-white">
                    {s.value}
                  </p>
                  <p className="mt-1.5 text-[11px] font-medium leading-tight text-red-100/80">
                    {s.label}
                  </p>
                </div>
              ))}
        </div>

        {/* trust points */}
        <ul className="mt-7 space-y-2.5 border-t border-white/15 pt-6">
          {features.map((f) => (
            <li key={f} className="flex items-start gap-2.5 text-[13px] text-red-50/90">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-400/15 ring-1 ring-emerald-300/30">
                <BadgeCheck className="h-3.5 w-3.5 text-emerald-300" />
              </span>
              <span className="leading-snug">{f}</span>
            </li>
          ))}
        </ul>

        {/* helpline + secure */}
        <div className="mt-7 flex items-center gap-3 rounded-2xl bg-black/30 p-3.5 ring-1 ring-white/15 backdrop-blur-md shadow-lg shadow-black/20">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-white/25 to-white/10 ring-1 ring-white/20">
            <PhoneCall className="h-4 w-4 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-red-200/80">
              {helplineLabel}
            </p>
            <p className="truncate text-sm font-bold tracking-tight text-white">{helplineValue}</p>
          </div>
          <div className="flex shrink-0 items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-red-100/90 ring-1 ring-white/15">
            <MapPin className="h-3.5 w-3.5" />
            {location}
          </div>
        </div>

        <p className="mt-5 flex items-center gap-2 text-[11px] font-medium text-red-100/70">
          <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-300" />
          {secureNote}
        </p>
      </div>
    </div>
  );
}
