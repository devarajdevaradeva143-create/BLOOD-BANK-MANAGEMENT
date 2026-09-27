import { ListChecks } from "lucide-react";
import PageHeader from "../components/PageHeader";
import ProcessTimeline from "../components/process/ProcessTimeline";
import { useLanguage } from "../i18n/LanguageContext";

export default function ProcessPage() {
  const { t } = useLanguage();
  return (
    <div>
      <PageHeader
        title={t("process.page.title")}
        subtitle={t("process.page.subtitle")}
        icon={<ListChecks className="w-8 h-8" />}
      />
      <ProcessTimeline />
    </div>
  );
}
