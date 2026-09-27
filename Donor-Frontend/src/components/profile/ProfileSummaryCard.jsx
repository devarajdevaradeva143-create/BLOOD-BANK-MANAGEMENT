import { BadgeCheck, Droplet } from "lucide-react";
import Button from "../ui/Button";

export default function ProfileSummaryCard({ donor, t }) {
  const statusColor =
    donor.eligibilityStatus === "Eligible"
      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
      : "bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300";
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-600 text-white">
            <Droplet className="h-8 w-8" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              {donor.name}
            </h3>
            <p className="text-sm text-gray-500 dark:text-slate-400">
              {t("profile.donorId")}: {donor.donorId}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold ${statusColor}`}
          >
            <BadgeCheck className="h-4 w-4" />
            {t(`profile.${donor.eligibilityStatus.toLowerCase()}`)}
          </span>
          <span className="rounded-full bg-brand-100 px-3 py-1 text-sm font-semibold text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
            {donor.bloodGroup}
          </span>
        </div>
      </div>
    </div>
  );
}
