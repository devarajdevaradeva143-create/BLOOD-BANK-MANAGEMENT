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
  gradientClass = 'from-red-800 via-red-700 to-rose-900',
}: AuthSidePanelProps) {
  return (
    <div
      className={`relative hidden w-full overflow-hidden bg-gradient-to-br ${gradientClass} lg:flex lg:w-1/2 lg:items-center lg:justify-center lg:p-10 xl:p-12`}
    >
      {/* décor */}
      <div
        className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-white/10 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-black/20 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 opacity-[0.15]"
        aria-hidden="true"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
          backgroundSize: '22px 22px',
        }}
      />

      <div className="relative w-full max-w-md">
        {/* org header */}
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-red-700 shadow-lg shadow-black/20">
            <Droplet className="h-6 w-6" fill="currentColor" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-lg font-bold leading-tight text-white">{orgName}</p>
            <p className="truncate text-xs font-medium tracking-wide text-red-100/90">{orgSub}</p>
          </div>
          <span className="ml-auto hidden shrink-0 items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white ring-1 ring-white/25 backdrop-blur sm:inline-flex">
            <BadgeCheck className="h-3 w-3" />
            TN Govt
          </span>
        </div>

        {/* headline */}
        <div className="mt-7">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-red-200/90">
            {eyebrow}
          </p>
          <h1 className="mt-2 text-[22px] font-bold leading-snug text-white">{headline}</h1>
          <p className="mt-2 text-sm leading-relaxed text-red-50/85">{description}</p>
        </div>

        {/* stats */}
        <div className="mt-6 grid grid-cols-2 gap-2.5">
          {stats.map((s) => (
            <div
              key={s.label}
              className="rounded-xl bg-white/10 p-3 ring-1 ring-white/15 backdrop-blur transition hover:bg-white/[0.14]"
            >
              <s.icon className="h-4 w-4 text-red-100" />
              <p className="mt-2 text-base font-bold leading-none text-white">{s.value}</p>
              <p className="mt-1 text-[11px] font-medium leading-tight text-red-100/80">
                {s.label}
              </p>
            </div>
          ))}
        </div>

        {/* trust points */}
        <ul className="mt-6 space-y-2 border-t border-white/15 pt-5">
          {features.map((f) => (
            <li key={f} className="flex items-start gap-2 text-[13px] text-red-50/90">
              <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
              <span className="leading-snug">{f}</span>
            </li>
          ))}
        </ul>

        {/* helpline + secure */}
        <div className="mt-6 flex items-center gap-3 rounded-xl bg-black/25 p-3 ring-1 ring-white/15 backdrop-blur">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/15">
            <PhoneCall className="h-4 w-4 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-red-200/80">
              {helplineLabel}
            </p>
            <p className="truncate text-sm font-bold text-white">{helplineValue}</p>
          </div>
          <div className="flex shrink-0 items-center gap-1 text-[11px] font-medium text-red-100/85">
            <MapPin className="h-3.5 w-3.5" />
            {location}
          </div>
        </div>

        <p className="mt-4 flex items-center gap-1.5 text-[11px] text-red-100/70">
          <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
          {secureNote}
        </p>
      </div>
    </div>
  );
}
