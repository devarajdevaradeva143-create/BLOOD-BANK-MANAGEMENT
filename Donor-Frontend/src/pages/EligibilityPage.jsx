import { ShieldCheck } from "lucide-react";
import PageHeader from "../components/PageHeader";
import EligibilityChecker from "../components/eligibility/EligibilityChecker";
import { useLanguage } from "../i18n/LanguageContext";

export default function EligibilityPage() {
  const { t } = useLanguage();
  return (
    <div>
      <PageHeader
        title={t("eligibility.page.title")}
        subtitle={t("eligibility.page.subtitle")}
        icon={<ShieldCheck className="w-8 h-8" />}
      />
      <section className="pb-16 md:pb-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <EligibilityChecker />
        </div>
      </section>
    </div>
  );
}
