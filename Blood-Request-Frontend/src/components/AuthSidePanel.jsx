import {
  Activity,
  ClipboardList,
  HeartPulse,
  PhoneCall,
  ShieldCheck,
  Siren,
} from 'lucide-react'

const FEATURES = [
  {
    icon: Siren,
    title: 'Priority Requests',
    text: 'Emergency, surgery & ICU routing',
  },
  {
    icon: Activity,
    title: 'Live Availability',
    text: 'Real-time stock across districts',
  },
  {
    icon: ClipboardList,
    title: 'Full Tracking',
    text: 'Submitted to approved to fulfilled',
  },
  {
    icon: ShieldCheck,
    title: 'OTP Verified',
    text: 'Secure hospital-grade access',
  },
]

const STATS = [
  { value: '38', label: 'Districts' },
  { value: '8', label: 'Blood Groups' },
  { value: '24×7', label: 'Support' },
]

export default function AuthSidePanel() {
  return (
    <div className="hidden lg:flex lg:w-1/2 relative flex-col overflow-hidden bg-gradient-to-br from-red-950 via-red-800 to-red-600 text-white">
      {/* Decorative glows + dot pattern */}
      <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
      <div className="absolute top-1/3 -left-24 h-72 w-72 rounded-full bg-red-400/20 blur-3xl" />
      <div
        className="absolute inset-0 opacity-[0.12]"
        style={{
          backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)',
          backgroundSize: '22px 22px',
        }}
      />

      <div className="relative z-10 flex h-full flex-col justify-between px-12 py-10 xl:px-16">
        {/* Brand row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/30 backdrop-blur">
              <HeartPulse size={26} className="text-white" />
            </div>
            <div>
              <p className="text-lg font-bold leading-tight">Life Saver</p>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-red-200">
                Blood Bank Management
              </p>
            </div>
          </div>
          <span className="rounded-full bg-white/10 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider ring-1 ring-white/25">
            Hospital Portal
          </span>
        </div>

        {/* Hero copy */}
        <div className="mt-10">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-red-200">
            Tamil Nadu Blood Bank Network
          </p>
          <h2 className="mt-3 text-3xl font-bold leading-tight xl:text-4xl">
            Hospital Blood
            <br />
            Request Portal
          </h2>
          <p className="mt-3 max-w-md text-sm leading-6 text-red-100">
            Raise, track and manage blood requirements for your patients —
            routed directly to the district blood bank with priority handling
            for emergencies.
          </p>

          {/* Feature cards */}
          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="flex items-start gap-3 rounded-xl bg-white/10 p-3.5 ring-1 ring-white/15 backdrop-blur transition hover:bg-white/15"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-red-700">
                  <feature.icon size={18} />
                </span>
                <span>
                  <span className="block text-[13px] font-bold">{feature.title}</span>
                  <span className="mt-0.5 block text-xs leading-4 text-red-100">
                    {feature.text}
                  </span>
                </span>
              </div>
            ))}
          </div>

          {/* Stats strip */}
          <div className="mt-6 grid grid-cols-3 divide-x divide-white/20 rounded-2xl bg-white/10 ring-1 ring-white/20 backdrop-blur">
            {STATS.map((stat) => (
              <div key={stat.label} className="px-4 py-3.5 text-center">
                <p className="text-xl font-bold">{stat.value}</p>
                <p className="mt-0.5 text-[11px] font-medium uppercase tracking-wider text-red-200">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Emergency helpline footer */}
        <div className="mt-10 flex items-center justify-between gap-4 rounded-2xl bg-black/25 px-5 py-4 ring-1 ring-white/20">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-red-700">
              <PhoneCall size={19} />
            </span>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-red-200">
                Emergency Helpline (Toll-Free)
              </p>
              <p className="text-2xl font-bold leading-none tracking-wide">108</p>
            </div>
          </div>
          <p className="flex items-center gap-1.5 text-xs font-medium text-red-100">
            <ShieldCheck size={15} />
            Secure &amp; Verified
          </p>
        </div>
      </div>

      {/* Bottom accent */}
      <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gradient-to-r from-white/30 via-white/80 to-white/30" />
    </div>
  )
}
