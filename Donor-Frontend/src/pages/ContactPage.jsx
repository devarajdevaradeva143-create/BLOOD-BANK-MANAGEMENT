import { MessageSquare } from "lucide-react";
import PageHeader from "../components/PageHeader";
import ContactInfo from "../components/contact/ContactInfo";
import ContactForm from "../components/contact/ContactForm";
import { useLanguage } from "../i18n/LanguageContext";

export default function ContactPage() {
  const { t } = useLanguage();
  return (
    <div>
      <PageHeader
        title={t("contact.page.title")}
        subtitle={t("contact.page.subtitle")}
        icon={<MessageSquare className="w-8 h-8" />}
      />
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-2">
            <div className="animate-fade-in">
              <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
                {t("contact.getInTouch.title")}
              </h2>
              <p className="mt-3 max-w-md text-base leading-relaxed text-gray-600 dark:text-slate-400">
                {t("contact.getInTouch.text")}
              </p>
              <div className="mt-4 h-1 w-12 rounded-full bg-brand-600" />
              <div className="mt-8">
                <ContactInfo />
              </div>
            </div>

            <div className="animate-slide-up">
              <ContactForm />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
