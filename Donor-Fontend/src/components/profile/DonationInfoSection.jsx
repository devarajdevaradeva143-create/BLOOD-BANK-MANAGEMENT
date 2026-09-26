import { Calendar, CalendarDays, Award, CheckCircle2 } from "lucide-react";

export default function DonationInfoSection({ donor, t }) {
  const statusColor =
    donor.eligibilityStatus === "Eligible"
      ? "text-emerald-600 dark:text-emerald-400"
      : "text-red-600 dark:text-red-400";

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <h3 className="mb-6 text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
        <CalendarDays className="h-5 w-5 text-brand-600" />
        Donation Information
      </h3>
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-slate-800 dark:bg-slate-950">
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-slate-400">
            <Calendar className="h-4 w-4" />
            {t("profile.lastDonation")}
          </div>
          <p className="mt-1 text-base font-semibold text-gray-900 dark:text-white">
            {donor.lastDonationDate}
          </p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-slate-800 dark:bg-slate-950">
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-slate-400">
            <Award className="h-4 w-4" />
            {t("profile.totalDonations")}
          </div>
          <p className="mt-1 text-base font-semibold text-gray-900 dark:text-white">
            {donor.totalDonations}
          </p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-slate-800 dark:bg-slate-950">
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-slate-400">
            <CheckCircle2 className="h-4 w-4" />
            {t("profile.eligibility")}
          </div>
          <p className={`mt-1 text-base font-semibold ${statusColor}`}>
            {donor.eligibilityStatus}
          </p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-slate-800 dark:bg-slate-950">
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-slate-400">
            <Calendar className="h-4 w-4" />
            {t("profile.nextEligible")}
          </div>
          <p className="mt-1 text-base font-semibold text-gray-900 dark:text-white">
            {donor.nextEligibleDate}
          </p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-slate-800 dark:bg-slate-950">
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-slate-400">
            <Calendar className="h-4 w-4" />
            {t("profile.registered")}
          </div>
          <p className="mt-1 text-base font-semibold text-gray-900 dark:text-white">
            {donor.registrationDate}
          </p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-slate-800 dark:bg-slate-950">
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-slate-400">
            <CalendarDays className="h-4 w-4" />
            {t("profile.eligibility")}
          </div>
          <p className="mt-1 text-base font-semibold text-gray-900 dark:text-white">
            {donor.isActive ? "Active Donor" : "Inactive"}
          </p>
        </div>
      </div>
    </div>
  );
}
