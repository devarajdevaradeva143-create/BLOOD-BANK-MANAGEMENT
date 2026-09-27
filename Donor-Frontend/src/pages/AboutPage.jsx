import { HeartHandshake } from "lucide-react";
import PageHeader from "../components/PageHeader";
import ImportanceSection from "../components/about/ImportanceSection";
import SafetySection from "../components/about/SafetySection";
import WhoCanDonate from "../components/about/WhoCanDonate";
import MythsFacts from "../components/about/MythsFacts";
import { useLanguage } from "../i18n/LanguageContext";

export default function AboutPage() {
  const { t } = useLanguage();
  return (
    <div>
      <PageHeader
        title={t("about.page.title")}
        subtitle={t("about.page.subtitle")}
        icon={<HeartHandshake className="w-8 h-8" />}
      />
      <ImportanceSection />
      <SafetySection />
      <WhoCanDonate />
      <MythsFacts />
    </div>
  );
}
