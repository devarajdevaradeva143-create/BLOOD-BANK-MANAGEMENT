import { Link } from "react-router-dom";
import { CheckCircle2, Heart, ArrowRight } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";

export default function Hero() {
  const { t } = useLanguage();
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-brand-50 via-white to-gray-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-40 -top-40 h-[28rem] w-[28rem] rounded-full bg-brand-100/60 blur-3xl dark:bg-brand-900/25"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-brand-50 blur-3xl dark:bg-brand-950/40"
      />

      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-24 lg:px-8 lg:py-28">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="animate-fade-in">
            <span className="inline-flex items-center rounded-full bg-brand-100 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
              {t("home.hero.badge")}
            </span>

            <h1 className="mt-6 text-4xl font-extrabold leading-tight tracking-tight text-gray-900 dark:text-white sm:text-5xl md:text-6xl">
              {t("home.hero.title")}{" "}
              <span className="text-brand-600 dark:text-brand-500">
                {t("home.hero.titleHighlight")}
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-relaxed text-gray-600 dark:text-slate-400 sm:text-lg">
              {t("home.hero.subtext")}
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                to="/donate"
                className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950"
              >
                <Heart className="h-4 w-4" />
                {t("home.hero.donateNow")}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/eligibility"
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 dark:border-slate-600 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800 dark:focus-visible:ring-offset-slate-950"
              >
                {t("home.hero.checkEligibility")}
              </Link>
            </div>

            <ul className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-sm text-gray-500 dark:text-slate-400">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-brand-600" />
                {t("home.hero.trust.healthCheck")}
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-brand-600" />
                {t("home.hero.trust.cycle")}
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-brand-600" />
                {t("home.hero.trust.certified")}
              </li>
            </ul>
          </div>

          <div className="animate-slide-up mx-auto w-full max-w-lg lg:max-w-none">
            <svg
              viewBox="0 0 480 480"
              role="img"
              aria-label={t("home.hero.ariaLabel")}
              className="h-auto w-full"
            >
              <defs>
                <linearGradient
                  id="heroDropGrad"
                  x1="140"
                  y1="90"
                  x2="340"
                  y2="400"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop stopColor="#ef4444" />
                  <stop offset="1" stopColor="#7f1d1d" />
                </linearGradient>
                <linearGradient
                  id="heroShine"
                  x1="180"
                  y1="160"
                  x2="220"
                  y2="300"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop stopColor="#ffffff" stopOpacity="0.45" />
                  <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
                </linearGradient>
                <radialGradient
                  id="heroGlow"
                  cx="0"
                  cy="0"
                  r="1"
                  gradientTransform="translate(240 240) scale(210)"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop stopColor="#dc2626" stopOpacity="0.14" />
                  <stop offset="1" stopColor="#dc2626" stopOpacity="0" />
                </radialGradient>
              </defs>

              <circle
                cx="240"
                cy="240"
                r="210"
                fill="url(#heroGlow)"
                className="dark:opacity-80"
              />
              <circle
                cx="240"
                cy="240"
                r="196"
                fill="none"
                stroke="#fecaca"
                strokeWidth="2"
                strokeDasharray="10 12"
                className="dark:stroke-brand-800"
              />
              <circle
                cx="240"
                cy="240"
                r="158"
                fill="none"
                stroke="#dc2626"
                strokeOpacity="0.12"
                strokeWidth="14"
              />

              <path
                d="M240 96 C240 96 138 208 138 282 C138 340 184 388 240 388 C296 388 342 340 342 282 C342 208 240 96 240 96 Z"
                fill="url(#heroDropGrad)"
              />
              <path
                d="M240 96 C240 96 138 208 138 282 C138 340 184 388 240 388 C296 388 342 340 342 282 C342 208 240 96 240 96 Z"
                fill="none"
                stroke="#ffffff"
                strokeOpacity="0.15"
                strokeWidth="2"
              />
              <path
                d="M196 196 C178 224 172 254 178 286"
                fill="none"
                stroke="url(#heroShine)"
                strokeWidth="16"
                strokeLinecap="round"
              />

              <path
                d="M158 300 H196 L214 262 L242 344 L264 300 H322"
                fill="none"
                stroke="#ffffff"
                strokeWidth="7"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.92"
              />

              <g>
                <circle
                  cx="86"
                  cy="150"
                  r="26"
                  fill="#fee2e2"
                  stroke="#fca5a5"
                  strokeWidth="2"
                  className="dark:fill-brand-900/60 dark:stroke-brand-700"
                />
                <circle cx="86" cy="150" r="11" fill="#dc2626" opacity="0.75" />
              </g>
              <g>
                <circle
                  cx="404"
                  cy="330"
                  r="20"
                  fill="#fee2e2"
                  stroke="#fca5a5"
                  strokeWidth="2"
                  className="dark:fill-brand-900/60 dark:stroke-brand-700"
                />
                <circle cx="404" cy="330" r="8" fill="#dc2626" opacity="0.75" />
              </g>
              <g>
                <circle
                  cx="382"
                  cy="196"
                  r="14"
                  fill="#fecaca"
                  stroke="#f87171"
                  strokeWidth="2"
                  className="dark:fill-brand-900/50 dark:stroke-brand-700"
                />
                <circle cx="382" cy="196" r="6" fill="#b91c1c" opacity="0.8" />
              </g>
              <g>
                <circle
                  cx="112"
                  cy="352"
                  r="16"
                  fill="#fecaca"
                  stroke="#f87171"
                  strokeWidth="2"
                  className="dark:fill-brand-900/50 dark:stroke-brand-700"
                />
                <circle cx="112" cy="352" r="7" fill="#b91c1c" opacity="0.8" />
              </g>
              <circle cx="340" cy="86" r="7" fill="#dc2626" opacity="0.4" />
              <circle cx="64" cy="248" r="5" fill="#dc2626" opacity="0.35" />
              <circle cx="430" cy="252" r="5" fill="#dc2626" opacity="0.3" />

              <g>
                <circle
                  cx="376"
                  cy="108"
                  r="44"
                  fill="#ffffff"
                  stroke="#fecaca"
                  strokeWidth="3"
                  className="dark:fill-slate-900 dark:stroke-brand-800"
                />
                <rect
                  x="368"
                  y="86"
                  width="16"
                  height="44"
                  rx="4"
                  fill="#dc2626"
                />
                <rect
                  x="354"
                  y="100"
                  width="44"
                  height="16"
                  rx="4"
                  fill="#dc2626"
                />
              </g>
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
}
