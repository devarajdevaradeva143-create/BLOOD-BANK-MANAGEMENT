import { useEffect, useState } from "react";
import { Award, Bell, BellRing, CheckCircle2, Info, Loader2 } from "lucide-react";
import Card from "../ui/Card";
import Button from "../ui/Button";
import Certificate from "./Certificate";
import {
  cancelDonationReminder,
  scheduleDonationReminder,
} from "../../services/reminderApi";
import { getDonationById } from "../../services/donationStore";
import { useLanguage } from "../../i18n/LanguageContext";

function DetailRow({ label, children }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3.5">
      <span className="text-sm text-gray-500 dark:text-slate-400">{label}</span>
      <span className="text-right text-sm font-semibold text-gray-900 dark:text-white">
        {children}
      </span>
    </div>
  );
}

export default function Confirmation({ data, onNewRequest }) {
  const { t } = useLanguage();
  const [showCertificate, setShowCertificate] = useState(false);
  const [reminder, setReminder] = useState(null);
  const [reminding, setReminding] = useState(false);
  const [status, setStatus] = useState(data?.status || "pending");

  // Poll the store so the certificate button appears live once
  // that district admin approves (e.g. approved in another tab).
  useEffect(() => {
    const id = data?.requestId;
    if (!id) return;
    const sync = () => {
      try {
        const rec = getDonationById(id);
        if (rec && rec.status) setStatus(rec.status);
      } catch {
        // ignore storage errors
      }
    };
    sync();
    const timer = setInterval(sync, 2000);
    return () => clearInterval(timer);
  }, [data?.requestId]);

  const nextDonationDate = (() => {
    const d = new Date(data.date);
    d.setDate(d.getDate() + 90);
    return d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  })();

  const handleRemind = async () => {
    if (reminding) return;
    setReminding(true);
    await scheduleDonationReminder({
      requestId: data.requestId,
      mobile: data.mobile,
      nextDate: nextDonationDate,
    });
    setReminder({ date: nextDonationDate });
    setReminding(false);
  };

  const handleCancelReminder = async () => {
    await cancelDonationReminder(data.requestId);
    setReminder(null);
  };

  return (
    <Card className="mx-auto max-w-3xl animate-slide-up p-6 text-center sm:p-10">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
        <CheckCircle2 className="h-8 w-8" />
      </div>

      <h2 className="mt-6 text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
        {t("donate.confirm.title")}
      </h2>
      <p className="mx-auto mt-3 max-w-2xl text-base leading-relaxed text-gray-600 dark:text-slate-400">
        {t("donate.confirm.subtitle")}
      </p>
      {data.district && (
        <p className="mx-auto mt-3 max-w-2xl text-sm font-semibold text-gray-700 dark:text-slate-300">
          Request sent to {data.district} district admin
        </p>
      )}

      <div className="mt-8 divide-y divide-gray-200 border-t border-gray-200 text-left dark:divide-slate-700 dark:border-slate-700">
        <DetailRow label={t("donate.confirm.requestId")}>
          <span className="font-mono font-semibold text-brand-600 dark:text-brand-400">
            {data.requestId}
          </span>
        </DetailRow>
        <DetailRow label={t("donate.confirm.donorName")}>
          {data.donorName}
        </DetailRow>
        <DetailRow label={t("donate.confirm.bloodGroup")}>
          <span className="inline-block rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700 dark:bg-brand-900/50 dark:text-brand-400">
            {data.bloodGroup}
          </span>
        </DetailRow>
        <DetailRow label={t("donate.confirm.center")}>{data.center}</DetailRow>
        {data.district && (
          <DetailRow label={t("donate.field.district")}>{data.district}</DetailRow>
        )}
        <DetailRow label={t("donate.confirm.scheduled")}>
          {`${data.date} · ${data.time}`}
        </DetailRow>
        <DetailRow label={t("donate.confirm.status")}>
          {status === "approved" ? (
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400">
              {t("donate.confirm.statusApproved")}
            </span>
          ) : status === "rejected" ? (
            <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-800 dark:bg-red-950 dark:text-red-400">
              {t("donate.confirm.statusRejected")}
            </span>
          ) : (
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800 dark:bg-amber-950 dark:text-amber-400">
              {t("donate.confirm.statusPending")}
            </span>
          )}
        </DetailRow>
      </div>

      {/* NEXT DONATION REMINDER */}
      <div className="mt-6 rounded-xl border border-gray-200 bg-gray-50 p-4 text-left dark:border-slate-700 dark:bg-slate-800/60">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-brand-900/50 dark:text-brand-400">
            {reminder ? (
              <BellRing className="h-5 w-5" />
            ) : (
              <Bell className="h-5 w-5" />
            )}
          </span>
          <div className="flex-1">
            <p className="text-sm font-bold text-gray-900 dark:text-white">
              {t("donate.remind.title")}
            </p>
            {reminder ? (
              <>
                <p className="mt-1 text-sm text-gray-600 dark:text-slate-400">
                  {t("donate.remind.set", {
                    mobile: data.mobile,
                    date: reminder.date,
                  })}
                </p>
                <button
                  type="button"
                  onClick={handleCancelReminder}
                  className="mt-2 text-xs font-semibold text-red-600 underline hover:text-red-700 dark:text-brand-400"
                >
                  {t("donate.remind.cancel")}
                </button>
              </>
            ) : (
              <>
                <p className="mt-1 text-sm text-gray-600 dark:text-slate-400">
                  {t("donate.remind.desc", {
                    mobile: data.mobile,
                    date: nextDonationDate,
                  })}
                </p>
                <Button
                  variant="outline"
                  className="mt-3 px-4 py-2"
                  onClick={handleRemind}
                  disabled={reminding}
                >
                  {reminding ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Bell className="h-4 w-4" />
                  )}
                  {reminding
                    ? t("donate.remind.sending")
                    : t("donate.remind.button")}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      <p className="mt-6 flex items-start justify-center gap-2 text-sm text-gray-500 dark:text-slate-400">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <span>{t("donate.confirm.note")}</span>
      </p>

      <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
        {status === "approved" ? (
          <Button
            variant="outline"
            onClick={() => setShowCertificate(true)}
          >
            <Award className="h-4 w-4" />
            {t("donate.certificate.open")}
          </Button>
        ) : (
          <p className="max-w-md text-sm text-gray-500 dark:text-slate-400">
            Admin approval-kaga wait pannunga — approve aana piragu certificate download panna mudiyum.
          </p>
        )}
        <Button variant="primary" onClick={onNewRequest}>
          {t("donate.confirm.newRequest")}
        </Button>
      </div>

      {showCertificate && (
        <Certificate data={data} onClose={() => setShowCertificate(false)} />
      )}
    </Card>
  );
}
