import { useRef, useState } from "react";
import { Send } from "lucide-react";
import Input from "../ui/Input";
import Select from "../ui/Select";
import Button from "../ui/Button";
import { useToast } from "../../context/ToastContext";
import { useLanguage } from "../../i18n/LanguageContext";

const TOPICS = ["general", "appointment", "eligibility", "camp", "feedback"];

const EMPTY_FORM = {
  name: "",
  email: "",
  phone: "",
  topic: "",
  message: "",
};

function validate(data, t) {
  const errors = {};

  if (!data.name.trim()) {
    errors.name = t("contact.validation.nameRequired");
  } else if (data.name.trim().length < 2) {
    errors.name = t("contact.validation.nameShort");
  }

  if (!data.email.trim()) {
    errors.email = t("contact.validation.emailRequired");
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) {
    errors.email = t("contact.validation.emailInvalid");
  }

  if (data.phone.trim() && !/^[6-9]\d{9}$/.test(data.phone.trim())) {
    errors.phone = t("contact.validation.phoneInvalid");
  }

  if (!data.topic) errors.topic = t("contact.validation.topicRequired");

  if (!data.message.trim()) {
    errors.message = t("contact.validation.messageRequired");
  } else if (data.message.trim().length < 10) {
    errors.message = t("contact.validation.messageShort");
  }

  return errors;
}

export default function ContactForm() {
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const formRef = useRef(null);
  const toastCtx = useToast();
  const toast = toastCtx.toast ?? toastCtx;
  const { t } = useLanguage();

  const handleChange = (field) => (value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validationErrors = validate(formData, t);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      const firstErrorId = ["name", "email", "phone", "topic", "message"].find(
        (id) => validationErrors[id]
      );
      document.getElementById(firstErrorId)?.focus();
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    setFormData(EMPTY_FORM);
    setErrors({});
    toast.success(t("contact.toast.sent"));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      noValidate
      className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:p-8"
    >
      <h2 className="text-lg font-bold text-gray-900 dark:text-white">
        {t("contact.form.title")}
      </h2>
      <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
        {t("contact.form.subtitle")}
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Input
          id="name"
          label={t("contact.form.name")}
          value={formData.name}
          onChange={handleChange("name")}
          error={errors.name}
          placeholder={t("contact.form.namePlaceholder")}
          required
          autoComplete="name"
        />
        <Input
          id="email"
          type="email"
          label={t("contact.form.email")}
          value={formData.email}
          onChange={handleChange("email")}
          error={errors.email}
          placeholder={t("contact.form.emailPlaceholder")}
          required
          autoComplete="email"
        />
        <Input
          id="phone"
          type="tel"
          label={t("contact.form.phone")}
          value={formData.phone}
          onChange={handleChange("phone")}
          error={errors.phone}
          placeholder={t("contact.form.phonePlaceholder")}
          autoComplete="tel"
        />
        <Select
          id="topic"
          label={t("contact.form.topic")}
          value={formData.topic}
          onChange={handleChange("topic")}
          options={TOPICS.map((key) => t(`contact.topic.${key}`))}
          error={errors.topic}
          placeholder={t("contact.form.topicPlaceholder")}
          required
        />
        <div className="sm:col-span-2">
          <label
            htmlFor="message"
            className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-slate-300"
          >
            {t("contact.form.message")}
            <span className="ml-0.5 text-red-600" aria-hidden="true">
              *
            </span>
          </label>
          <textarea
            id="message"
            name="message"
            rows={5}
            value={formData.message}
            onChange={(e) => handleChange("message")(e.target.value)}
            placeholder={t("contact.form.messagePlaceholder")}
            required
            aria-invalid={errors.message ? "true" : undefined}
            aria-describedby={errors.message ? "message-error" : undefined}
            className={`block w-full rounded-lg border px-3.5 py-3 text-sm text-gray-900 placeholder-gray-400 shadow-sm outline-none transition-colors focus:ring-2 dark:bg-slate-900 dark:text-slate-100 dark:placeholder-slate-500 ${
              errors.message
                ? "border-red-400 focus:border-red-500 focus:ring-red-200 dark:border-red-500 dark:focus:border-red-400 dark:focus:ring-red-900/60"
                : "border-gray-300 focus:border-red-500 focus:ring-red-200 dark:border-slate-700 dark:focus:border-brand-500 dark:focus:ring-brand-900/60"
            }`}
          />
          {errors.message && (
            <p
              id="message-error"
              role="alert"
              className="mt-1.5 text-xs font-medium text-red-600 dark:text-red-400"
            >
              {errors.message}
            </p>
          )}
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between gap-4">
        <p className="text-xs text-gray-500 dark:text-slate-500">
          {t("contact.form.requiredNote")}
        </p>
        <Button type="submit">
          <Send className="h-4 w-4" />
          {t("contact.form.send")}
        </Button>
      </div>
    </form>
  );
}
