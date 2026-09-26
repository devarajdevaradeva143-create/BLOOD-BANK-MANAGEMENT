import { useState } from "react";
import { User, CalendarDays, HeartPulse, Loader2 } from "lucide-react";
import Card from "../ui/Card";
import Input from "../ui/Input";
import Select from "../ui/Select";
import Checkbox from "../ui/Checkbox";
import Button from "../ui/Button";
import { useLanguage } from "../../i18n/LanguageContext";
import {
  TN_DISTRICTS,
  BLOOD_GROUPS,
  DONATION_CENTERS,
} from "../../data/constants";

const INITIAL_FORM = {
  donorName: "",
  donorId: "",
  bloodGroup: "",
  age: "",
  gender: "",
  mobile: "",
  email: "",
  district: "",
  center: "",
  date: "",
  time: "",
  prevDate: "",
  notes: "",
};

function localToday() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

function SectionCard({ icon, title, children }) {
  return (
    <Card className="p-6">
      <h2 className="mb-6 flex items-center gap-3 text-lg font-bold text-gray-900 dark:text-white">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400">
          {icon}
        </span>
        <span className="flex flex-col gap-1.5">
          {title}
          <span className="h-1 w-10 rounded-full bg-red-600 dark:bg-brand-500" />
        </span>
      </h2>
      {children}
    </Card>
  );
}

export default function DonationForm({ onSubmit, onCancel = () => {} }) {
  const { t } = useLanguage();
  const [form, setForm] = useState(INITIAL_FORM);
  const [eligibility, setEligibility] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const today = localToday();

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleEligibilityChange = (checked) => {
    setEligibility(checked);
    setErrors((prev) => ({ ...prev, eligibility: undefined }));
  };

  const validate = () => {
    const newErrors = {};

    if (!form.donorName.trim()) newErrors.donorName = t("donate.validation.name");
    if (!form.donorId.trim()) newErrors.donorId = t("donate.validation.donorId");
    if (!form.bloodGroup) newErrors.bloodGroup = t("donate.validation.bloodGroup");

    if (!String(form.age).trim()) {
      newErrors.age = t("donate.validation.age");
    } else {
      const ageNum = Number(form.age);
      if (!Number.isInteger(ageNum) || ageNum < 18 || ageNum > 65)
        newErrors.age = t("donate.validation.ageRange");
    }

    if (!form.gender) newErrors.gender = t("donate.validation.gender");

    if (!/^[0-9]{10}$/.test(form.mobile))
      newErrors.mobile = t("donate.validation.mobile");

    if (!/\S+@\S+\.\S+/.test(form.email))
      newErrors.email = t("donate.validation.email");

    if (!form.district) newErrors.district = t("donate.validation.district");
    if (!form.center) newErrors.center = t("donate.validation.center");
    if (!form.date) newErrors.date = t("donate.validation.date");
    if (!form.time) newErrors.time = t("donate.validation.time");

    if (form.prevDate && form.prevDate > today)
      newErrors.prevDate = t("donate.validation.prevDate");

    if (!eligibility) newErrors.eligibility = t("donate.validation.eligibility");

    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setSubmitting(true);
    setTimeout(() => {
      onSubmit({ ...form, eligibility });
      setSubmitting(false);
    }, 600);
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      <SectionCard
        icon={<User className="h-5 w-5" />}
        title={t("donate.section.personal")}
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <Input
            id="donorName"
            label={t("donate.field.donorName")}
            value={form.donorName}
            onChange={(v) => handleChange("donorName", v)}
            error={errors.donorName}
            placeholder={t("donate.field.donorName")}
            required
          />
          <Input
            id="donorId"
            label={t("donate.field.donorId")}
            value={form.donorId}
            onChange={(v) => handleChange("donorId", v)}
            error={errors.donorId}
            placeholder={t("donate.placeholder.donorId")}
            required
          />
          <Select
            id="bloodGroup"
            label={t("donate.field.bloodGroup")}
            value={form.bloodGroup}
            onChange={(v) => handleChange("bloodGroup", v)}
            options={BLOOD_GROUPS}
            error={errors.bloodGroup}
            placeholder={t("donate.placeholder.select")}
            required
          />
          <Input
            id="age"
            type="number"
            label={t("donate.field.age")}
            value={form.age}
            onChange={(v) => handleChange("age", v)}
            error={errors.age}
            placeholder={t("donate.placeholder.age")}
            required
          />
          <div>
            <label
              htmlFor="gender"
              className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-slate-300"
            >
              {t("donate.field.gender")}
              <span className="ml-0.5 text-red-600" aria-hidden="true">
                *
              </span>
            </label>
            <select
              id="gender"
              name="gender"
              value={form.gender}
              onChange={(e) => handleChange("gender", e.target.value)}
              required
              aria-invalid={errors.gender ? "true" : undefined}
              aria-describedby={errors.gender ? "gender-error" : undefined}
              className={`block w-full rounded-lg border bg-white px-3.5 text-sm text-gray-900 shadow-sm outline-none transition-colors focus:ring-2 disabled:cursor-not-allowed disabled:bg-gray-100 dark:bg-slate-900 dark:text-slate-100 dark:disabled:bg-slate-800 dark:disabled:text-slate-500 ${
                errors.gender
                  ? "border-red-400 focus:border-red-500 focus:ring-red-200 dark:border-red-500 dark:focus:border-red-400 dark:focus:ring-red-900/60"
                  : "border-gray-300 focus:border-red-500 focus:ring-red-200 dark:border-slate-700 dark:focus:border-brand-500 dark:focus:ring-brand-900/60"
              } h-11`}
            >
              <option value="">{t("donate.placeholder.select")}</option>
              <option value="Male">{t("donate.option.male")}</option>
              <option value="Female">{t("donate.option.female")}</option>
              <option value="Transgender">{t("donate.option.transgender")}</option>
            </select>
            {errors.gender && (
              <p
                id="gender-error"
                role="alert"
                className="mt-1.5 text-xs font-medium text-red-600 dark:text-red-400"
              >
                {errors.gender}
              </p>
            )}
          </div>
          <Input
            id="mobile"
            type="tel"
            label={t("donate.field.mobile")}
            value={form.mobile}
            onChange={(v) => handleChange("mobile", v)}
            error={errors.mobile}
            placeholder={t("donate.placeholder.mobile")}
            maxLength={10}
            required
          />
          <Input
            id="email"
            type="email"
            label={t("donate.field.email")}
            value={form.email}
            onChange={(v) => handleChange("email", v)}
            error={errors.email}
            required
          />
        </div>
      </SectionCard>

      <SectionCard
        icon={<CalendarDays className="h-5 w-5" />}
        title={t("donate.section.donation")}
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <Select
            id="district"
            label={t("donate.field.district")}
            value={form.district}
            onChange={(v) => handleChange("district", v)}
            options={TN_DISTRICTS}
            error={errors.district}
            placeholder={t("donate.placeholder.select")}
            required
          />
          <Select
            id="center"
            label={t("donate.field.center")}
            value={form.center}
            onChange={(v) => handleChange("center", v)}
            options={DONATION_CENTERS}
            error={errors.center}
            placeholder={t("donate.placeholder.select")}
            required
          />
          <Input
            id="date"
            type="date"
            label={t("donate.field.date")}
            value={form.date}
            onChange={(v) => handleChange("date", v)}
            error={errors.date}
            min={today}
            required
          />
          <Input
            id="time"
            type="time"
            label={t("donate.field.time")}
            value={form.time}
            onChange={(v) => handleChange("time", v)}
            error={errors.time}
            required
          />
          <Input
            id="prevDate"
            type="date"
            label={t("donate.field.prevDate")}
            value={form.prevDate}
            onChange={(v) => handleChange("prevDate", v)}
            error={errors.prevDate}
            max={today}
            className="sm:col-span-2"
          />
        </div>
      </SectionCard>

      <SectionCard
        icon={<HeartPulse className="h-5 w-5" />}
        title={t("donate.section.health")}
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <Checkbox
            id="eligibility"
            label={t("donate.eligibility.label")}
            checked={eligibility}
            onChange={handleEligibilityChange}
            error={errors.eligibility}
            className="sm:col-span-2"
          />
          <div className="sm:col-span-2">
            <label
              htmlFor="notes"
              className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-slate-300"
            >
              {t("donate.field.notes")}
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={4}
              value={form.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
              placeholder={t("donate.placeholder.notes")}
              className={`block w-full min-h-[96px] rounded-lg border px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 shadow-sm outline-none transition-colors focus:ring-2 disabled:cursor-not-allowed disabled:bg-gray-100 dark:bg-slate-900 dark:text-slate-100 dark:placeholder-slate-500 dark:disabled:bg-slate-800 dark:disabled:text-slate-500 ${
                errors.notes
                  ? "border-red-400 focus:border-red-500 focus:ring-red-200 dark:border-red-500 dark:focus:border-red-400 dark:focus:ring-red-900/60"
                  : "border-gray-300 focus:border-red-500 focus:ring-red-200 dark:border-slate-700 dark:focus:border-brand-500 dark:focus:ring-brand-900/60"
              }`}
            />
            {errors.notes && (
              <p
                role="alert"
                className="mt-1.5 text-xs font-medium text-red-600 dark:text-red-400"
              >
                {errors.notes}
              </p>
            )}
          </div>
        </div>
      </SectionCard>

      <div className="flex flex-wrap gap-3">
        <Button type="submit" variant="primary" disabled={submitting}>
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {submitting ? t("donate.submitting") : t("donate.submit")}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          {t("donate.cancel")}
        </Button>
      </div>
    </form>
  );
}
