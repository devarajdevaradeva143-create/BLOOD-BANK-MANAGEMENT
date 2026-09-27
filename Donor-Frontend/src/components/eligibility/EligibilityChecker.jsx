import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  Info,
  RotateCcw,
  XCircle,
} from "lucide-react";
import {
  ELIGIBILITY_QUESTIONS,
  EMPTY_ELIGIBILITY,
  isEligible,
  isEligibilityComplete,
} from "../../data/constants";
import { useLanguage } from "../../i18n/LanguageContext";

export default function EligibilityChecker({ onProceed, proceedLabel }) {
  const [answers, setAnswers] = useState({ ...EMPTY_ELIGIBILITY });
  const { t } = useLanguage();

  const answeredCount = ELIGIBILITY_QUESTIONS.filter(
    (q) => answers[q.id] !== null
  ).length;
  const total = ELIGIBILITY_QUESTIONS.length;
  const complete = isEligibilityComplete(answers);
  const eligible = complete && isEligible(answers);
  const failedQuestions =
    complete && !eligible
      ? ELIGIBILITY_QUESTIONS.filter((q) => answers[q.id] !== q.healthyAnswer)
      : [];
  const progressPercent = Math.round((answeredCount / total) * 100);

  const handleAnswer = (id, value) => {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  };

  const handleReset = () => {
    setAnswers({ ...EMPTY_ELIGIBILITY });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-brand-50 p-2 dark:bg-brand-900/40">
              <ClipboardCheck className="h-5 w-5 text-brand-600 dark:text-brand-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100">
                {t("eligibility.heading")}
              </h2>
              <p className="text-sm text-gray-500 dark:text-slate-400">
                {t("eligibility.intro")}
              </p>
            </div>
          </div>
          {answeredCount > 0 && (
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              <RotateCcw className="h-4 w-4" />
              {t("eligibility.reset")}
            </button>
          )}
        </div>

        <div className="mt-6">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-gray-700 dark:text-slate-300">
              {t("eligibility.progress", { answered: answeredCount, total })}
            </span>
            <span className="font-semibold text-brand-600 dark:text-brand-400">
              {progressPercent}%
            </span>
          </div>
          <div
            className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-slate-800"
            role="progressbar"
            aria-valuenow={answeredCount}
            aria-valuemin={0}
            aria-valuemax={total}
          >
            <div
              className="h-full rounded-full bg-brand-600 transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        <ol className="mt-6 flex flex-col gap-4">
          {ELIGIBILITY_QUESTIONS.map((q, index) => (
            <li
              key={q.id}
              className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-950/60"
            >
              <div className="flex items-start gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
                  {index + 1}
                </span>
                <p className="text-sm font-medium leading-relaxed text-gray-800 dark:text-slate-200 sm:text-base">
                  {t(`eligibility.q.${q.id}`)}
                </p>
              </div>
              <div className="mt-4 flex gap-3">
                <button
                  type="button"
                  aria-pressed={answers[q.id] === true}
                  onClick={() => handleAnswer(q.id, true)}
                  className={`flex-1 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors ${
                    answers[q.id] === true
                      ? "border-brand-600 bg-brand-600 text-white shadow-sm"
                      : "border-gray-300 bg-white text-gray-700 hover:border-brand-300 hover:bg-brand-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-brand-700 dark:hover:bg-brand-900/30"
                  }`}
                >
                  {t("eligibility.yes")}
                </button>
                <button
                  type="button"
                  aria-pressed={answers[q.id] === false}
                  onClick={() => handleAnswer(q.id, false)}
                  className={`flex-1 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors ${
                    answers[q.id] === false
                      ? "border-brand-600 bg-brand-600 text-white shadow-sm"
                      : "border-gray-300 bg-white text-gray-700 hover:border-brand-300 hover:bg-brand-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-brand-700 dark:hover:bg-brand-900/30"
                  }`}
                >
                  {t("eligibility.no")}
                </button>
              </div>
            </li>
          ))}
        </ol>
      </div>

      {!complete && (
        <p className="text-center text-sm text-gray-500 dark:text-slate-400">
          {t("eligibility.answerAll", { total })}
        </p>
      )}

      {complete && eligible && (
        <div className="animate-fade-in rounded-2xl border border-emerald-300 bg-emerald-50 p-6 shadow-sm dark:border-emerald-800 dark:bg-emerald-950/40 md:p-8">
          <div className="flex items-start gap-4">
            <CheckCircle2 className="h-10 w-10 shrink-0 text-emerald-600" />
            <div>
              <h3 className="text-xl font-bold text-emerald-900 dark:text-emerald-200">
                {t("eligibility.eligible.title")}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-emerald-800 dark:text-emerald-300">
                {t("eligibility.eligible.text")}
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                {onProceed ? (
                  <button
                    type="button"
                    onClick={onProceed}
                    className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700"
                  >
                    {proceedLabel ?? t("eligibility.eligible.proceed")}
                    <ArrowRight className="h-4 w-4" />
                  </button>
                ) : (
                  <Link
                    to="/register"
                    className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700"
                  >
                    {t("eligibility.eligible.proceed")}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                )}
                <Link
                  to="/process"
                  className="inline-flex items-center gap-2 rounded-xl border border-emerald-300 bg-white px-5 py-2.5 text-sm font-semibold text-emerald-800 transition-colors hover:bg-emerald-100 dark:border-emerald-700 dark:bg-slate-900 dark:text-emerald-300 dark:hover:bg-emerald-950/60"
                >
                  {t("eligibility.eligible.process")}
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {complete && !eligible && (
        <div className="animate-fade-in rounded-2xl border border-red-300 bg-red-50 p-6 shadow-sm dark:border-red-800 dark:bg-red-950/40 md:p-8">
          <div className="flex items-start gap-4">
            <XCircle className="h-10 w-10 shrink-0 text-red-600 dark:text-red-400" />
            <div>
              <h3 className="text-xl font-bold text-red-900 dark:text-red-200">
                {t("eligibility.notEligible.title")}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-red-800 dark:text-red-300">
                {t("eligibility.notEligible.text")}
              </p>
              <ul className="mt-3 flex flex-col gap-2">
                {failedQuestions.map((q) => (
                  <li
                    key={q.id}
                    className="flex items-start gap-2 text-sm text-red-800 dark:text-red-300"
                  >
                    <span
                      className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-red-500"
                      aria-hidden="true"
                    />
                    {t(`eligibility.q.${q.id}`)}
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-sm leading-relaxed text-red-800 dark:text-red-300">
                {t("eligibility.notEligible.retryText")}
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  to="/contact"
                  className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700"
                >
                  {t("eligibility.notEligible.contact")}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <button
                  type="button"
                  onClick={handleReset}
                  className="inline-flex items-center gap-2 rounded-xl border border-red-300 bg-white px-5 py-2.5 text-sm font-semibold text-red-800 transition-colors hover:bg-red-100 dark:border-red-700 dark:bg-slate-900 dark:text-red-300 dark:hover:bg-red-950/60"
                >
                  <RotateCcw className="h-4 w-4" />
                  {t("eligibility.notEligible.tryAgain")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-start gap-3 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <Info className="mt-0.5 h-5 w-5 shrink-0 text-gray-400 dark:text-slate-500" />
        <p className="text-sm leading-relaxed text-gray-500 dark:text-slate-400">
          {t("eligibility.medicalNote")}
        </p>
      </div>
    </div>
  );
}
