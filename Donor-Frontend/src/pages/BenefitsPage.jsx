import { Gift } from "lucide-react";
import PageHeader from "../components/PageHeader";
import BenefitsGrid from "../components/benefits/BenefitsGrid";
import { useLanguage } from "../i18n/LanguageContext";

export default function BenefitsPage() {
  const { t } = useLanguage();
  return (
    <div>
      <PageHeader
        title={t("benefits.page.title")}
        subtitle={t("benefits.page.subtitle")}
        icon={<Gift className="w-8 h-8" />}
      />
      <BenefitsGrid />
    </div>
  );
}
