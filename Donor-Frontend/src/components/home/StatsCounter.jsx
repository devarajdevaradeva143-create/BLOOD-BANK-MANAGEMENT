import { useEffect, useState } from "react";
import { HOME_STATS } from "../../data/constants";
import { fetchStats } from "../../lib/api.js";
import useCountUp from "./useCountUp";
import { useLanguage } from "../../i18n/LanguageContext";

function StatCard({ id, value, suffix }) {
  const { t } = useLanguage();
  const { ref, value: current } = useCountUp(value);

  return (
    <div
      ref={ref}
      className="rounded-2xl border border-gray-100 bg-white p-6 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900"
    >
      <p className="text-4xl font-extrabold text-brand-600 dark:text-brand-500 sm:text-5xl">
        {current.toLocaleString("en-IN")}
        {suffix}
      </p>
      <p className="mt-3 text-sm font-medium text-gray-600 dark:text-slate-400 sm:text-base">
        {t(`home.stat.${id}`)}
      </p>
    </div>
  );
}

function fallbackValue(id) {
  const found = HOME_STATS.find((s) => s.id === id);
  return found ? found.value : 0;
}

export default function StatsCounter() {
  const { t } = useLanguage();
  const [live, setLive] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetchStats()
      .then((data) => {
        if (!cancelled) setLive(data);
      })
      .catch(() => {
        if (!cancelled) setLive(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const stats = [
    {
      id: "donors",
      value:
        live && Number.isFinite(Number(live.donors))
          ? Number(live.donors)
          : fallbackValue("donors"),
      suffix: "+",
    },
    {
      id: "lives",
      value:
        live && Number.isFinite(Number(live.livesSupported))
          ? Number(live.livesSupported)
          : fallbackValue("lives"),
      suffix: "+",
    },
    {
      id: "available",
      value:
        live && Number.isFinite(Number(live.availableUnits))
          ? Number(live.availableUnits)
          : 0,
      suffix: "",
    },
  ];

  return (
    <section className="bg-gray-50 py-16 dark:bg-slate-950 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 text-center animate-fade-in">
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
            {t("home.stats.title")}
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-base leading-relaxed text-gray-600 dark:text-slate-400">
            {t("home.stats.subtitle")}
          </p>
          <div className="mx-auto mt-4 h-1 w-12 rounded-full bg-brand-600" />
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {stats.map((stat, index) => (
            <div
              key={stat.id}
              className="animate-slide-up"
              style={{ animationDelay: `${index * 90}ms` }}
            >
              <StatCard {...stat} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
