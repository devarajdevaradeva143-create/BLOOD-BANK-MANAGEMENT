import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, CheckCircle2, Droplet, ShieldCheck } from "lucide-react";
import PageHeader from "../components/PageHeader";
import DonationForm from "../components/donate/DonationForm";
import Confirmation from "../components/donate/Confirmation";
import EligibilityChecker from "../components/eligibility/EligibilityChecker";
import { useToast } from "../context/ToastContext";
import { useLanguage } from "../i18n/LanguageContext";

export default function DonatePage() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState(null);
  const [stage, setStage] = useState("check"); // check | form
  const [checking, setChecking] = useState(false);
  const formRef = useRef(null);

  const goToForm = () => {
    setStage("form");
    requestAnimationFrame(() =>
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    );
  };

  const handleSubmit = (payload) => {
    const now = new Date();
    const dateNow = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(
      now.getDate()
    ).padStart(2, "0")}`;
    const requestId = `REQ-${dateNow}-${Math.floor(1000 + Math.random() * 9000)}`;

    setSubmitted({
      requestId,
      donorName: payload.donorName,
      bloodGroup: payload.bloodGroup,
      mobile: payload.mobile,
      center: payload.center,
      date: payload.date,
      time: payload.time,
    });
    toast.success(t("donate.toast.success"));
  };

  return (
    <div>
      <PageHeader
        title={t("donate.page.title")}
        subtitle={t("donate.page.subtitle")}
        icon={<Droplet className="w-8 h-8" />}
      />
      <section className="pb-16 md:pb-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          {submitted ? (
            <Confirmation
              data={submitted}
              onNewRequest={() => setSubmitted(null)}
            />
          ) : stage === "form" ? (
            <div ref={formRef}>
              {/* ELIGIBILITY VERIFIED BANNER */}
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 dark:border-emerald-800 dark:bg-emerald-950/40">
                <p className="flex items-center gap-2 text-sm font-semibold text-emerald-800 dark:text-emerald-300">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  {t("donate.eligibility.verified")}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setStage("check");
                    setChecking(false);
                  }}
                  className="text-xs font-semibold text-emerald-700 underline hover:text-emerald-900 dark:text-emerald-400"
                >
                  {t("donate.eligibility.recheck")}
                </button>
              </div>

              <DonationForm
                onSubmit={handleSubmit}
                onCancel={() => navigate(-1)}
              />
            </div>
          ) : (
            <>
              {/* CHECK ELIGIBILITY BANNER */}
              {!checking && (
                <div className="mb-6 flex flex-col items-start gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:p-6">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-900/40 dark:text-brand-400">
                    <ShieldCheck className="h-6 w-6" />
                  </span>
                  <div className="flex-1">
                    <h3 className="text-base font-bold text-gray-900 dark:text-white">
                      {t("donate.eligibility.title")}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
                      {t("donate.eligibility.desc")}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setChecking(true)}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700 sm:w-auto"
                  >
                    <ShieldCheck className="h-4 w-4" />
                    {t("donate.eligibility.button")}
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              )}

              {checking && (
                <div className="mb-8">
                  <EligibilityChecker
                    onProceed={goToForm}
                    proceedLabel={t("donate.eligibility.proceed")}
                  />
                </div>
              )}

              <div className="text-center">
                <button
                  type="button"
                  onClick={goToForm}
                  className="text-sm font-semibold text-gray-500 underline transition-colors hover:text-brand-600 dark:text-slate-400"
                >
                  {t("donate.eligibility.skip")} →
                </button>
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
