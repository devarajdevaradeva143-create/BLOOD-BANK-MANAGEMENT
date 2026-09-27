import { Phone, Mail, MapPin, Clock, Siren } from "lucide-react";
import { CONTACT_INFO } from "../../data/constants";
import { useLanguage } from "../../i18n/LanguageContext";

const cards = [
  {
    id: "phone",
    value: CONTACT_INFO.phone,
    href: `tel:${CONTACT_INFO.phone.replace(/\s/g, "")}`,
    icon: Phone,
    external: true,
  },
  {
    id: "emergency",
    value: CONTACT_INFO.emergency,
    href: `tel:${CONTACT_INFO.emergency}`,
    icon: Siren,
    external: true,
    highlight: true,
  },
  {
    id: "email",
    value: CONTACT_INFO.email,
    href: `mailto:${CONTACT_INFO.email}`,
    icon: Mail,
    external: true,
  },
  {
    id: "address",
    translated: true,
    icon: MapPin,
    external: false,
  },
  {
    id: "hours",
    translated: true,
    icon: Clock,
    external: false,
  },
];

export default function ContactInfo() {
  const { t } = useLanguage();
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {cards.map((card, index) => {
        const Icon = card.icon;
        const content = (
          <>
            <span
              className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                card.highlight
                  ? "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400"
                  : "bg-brand-100 text-brand-600 dark:bg-brand-900/40 dark:text-brand-400"
              }`}
            >
              <Icon className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400">
                {t(`contact.info.${card.id}.label`)}
              </p>
              <p
                className={`mt-1 break-words text-sm font-medium ${
                  card.highlight
                    ? "text-lg font-bold text-red-600 dark:text-red-400"
                    : "text-gray-900 dark:text-white"
                }`}
              >
                {card.translated ? t(`contact.info.${card.id}.value`) : card.value}
              </p>
            </div>
          </>
        );

        return (
          <div
            key={card.id}
            className={`animate-slide-up flex items-start gap-4 rounded-2xl border p-5 shadow-sm transition-shadow hover:shadow-md ${
              card.highlight
                ? "border-red-200 bg-red-50 dark:border-red-900/60 dark:bg-red-950/40 sm:col-span-2"
                : "border-gray-200 bg-white dark:border-slate-800 dark:bg-slate-900"
            } ${index === cards.length - 1 ? "sm:col-span-2" : ""}`}
            style={{ animationDelay: `${index * 60}ms` }}
          >
            {card.href ? (
              <a
                href={card.href}
                className="flex items-start gap-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 rounded-xl"
              >
                {content}
              </a>
            ) : (
              content
            )}
          </div>
        );
      })}
    </div>
  );
}
