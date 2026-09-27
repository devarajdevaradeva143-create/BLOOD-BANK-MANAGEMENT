import { CircleHelp } from "lucide-react";
import PageHeader from "../components/PageHeader";
import FaqAccordion from "../components/faq/FaqAccordion";
import { useLanguage } from "../i18n/LanguageContext";

export default function FaqPage() {
  const { t } = useLanguage();
  return (
    <div>
      <PageHeader
        title={t("faq.page.title")}
        subtitle={t("faq.page.subtitle")}
        icon={<CircleHelp className="w-8 h-8" />}
      />
      <FaqAccordion />
    </div>
  );
}
