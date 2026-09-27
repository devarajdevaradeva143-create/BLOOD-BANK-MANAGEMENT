import { Award, BadgeCheck, Droplet } from "lucide-react";
import ProfileAvatar from "./ProfileAvatar";

export default function ProfileSummaryCard({
  donor,
  t,
  editablePhoto = false,
  onPhotoChange,
}) {
  const safeDonor = donor || {};
  const status = String(safeDonor.eligibilityStatus || "").trim();
  const statusColor =
    status === "Eligible"
      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
      : status === "Not Eligible"
        ? "bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300"
        : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300";
  const total = Number(safeDonor.totalDonations ?? 0) || 0;
  const displayName = String(safeDonor.name || "").trim() || "Your Name";
  const donorId = String(safeDonor.donorId || "").trim() || "—";
  const bloodGroup = String(safeDonor.bloodGroup || "").trim() || "—";
  const statusKey = status ? `profile.${status.toLowerCase()}` : "";
  const statusLabel = statusKey ? t(statusKey) : "Not set";
  const showStatusTranslated = statusKey && statusLabel !== statusKey;
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-col items-center gap-5 sm:flex-row sm:justify-between">
        <div className="flex items-center gap-4">
          <ProfileAvatar
            src={safeDonor.photo}
            name={displayName}
            editable={editablePhoto}
            onPhotoChange={onPhotoChange}
          />
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              {displayName}
            </h3>
            <p className="text-sm text-gray-500 dark:text-slate-400">
              {t("profile.donorId")}: {donorId}
            </p>
            {/* Total donation count — eppovum theriyura mari */}
            <p className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-sm font-bold text-red-700 dark:bg-red-950/40 dark:text-red-300">
              <Droplet className="h-4 w-4" />
              {total} {t("profile.totalDonations")}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
            <Award className="h-4 w-4" />
            {total}x Donor
          </span>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold ${statusColor}`}
          >
            <BadgeCheck className="h-4 w-4" />
            {showStatusTranslated ? statusLabel : status || "Not set"}
          </span>
          <span className="rounded-full bg-brand-100 px-3 py-1 text-sm font-semibold text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
            {bloodGroup}
          </span>
        </div>
      </div>
    </div>
  );
}
