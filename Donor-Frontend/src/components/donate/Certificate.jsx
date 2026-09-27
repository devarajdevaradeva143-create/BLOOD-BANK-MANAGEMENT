import { useRef, useState } from "react";
import { Award, Download, Droplet, Loader2, Printer, X } from "lucide-react";
import { toPng } from "html-to-image";
import { useLanguage } from "../../i18n/LanguageContext";
import { useToast } from "../../context/ToastContext";

function InfoBlock({ label, value }) {
  return (
    <div className="text-center">
      <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-500">
        {label}
      </p>
      <p className="mt-1 text-base font-bold text-gray-900">{value}</p>
    </div>
  );
}

export default function Certificate({ data, onClose }) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const certRef = useRef(null);
  const [downloading, setDownloading] = useState(false);

  const issuedOn = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const safeData = {
    donorName: data?.donorName || "Donor",
    bloodGroup: data?.bloodGroup || "—",
    date: data?.date || new Date().toISOString().slice(0, 10),
    time: data?.time || "",
    center: data?.center || "Life Saver Blood Bank",
    requestId: data?.requestId || `CERT-${Date.now()}`,
  };

  const handleDownload = async () => {
    if (!certRef.current || downloading) return;
    setDownloading(true);
    try {
      // pixelRatio 2 fail aana 1-la retry — html-to-image memory issue-kaga.
      let dataUrl = null;
      try {
        dataUrl = await toPng(certRef.current, {
          cacheBust: true,
          pixelRatio: 2,
          backgroundColor: "#ffffff",
        });
      } catch {
        dataUrl = await toPng(certRef.current, {
          cacheBust: true,
          pixelRatio: 1,
          backgroundColor: "#ffffff",
        });
      }
      const link = document.createElement("a");
      link.download = `donation-certificate-${safeData.requestId}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success(t("donate.certificate.toast"));
    } catch {
      toast.error(t("donate.certificate.toastError"));
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-black/70 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label={t("donate.certificate.title")}
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Toolbar */}
        <div className="mb-3 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={handleDownload}
            disabled={downloading}
            className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
          >
            {downloading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            {downloading
              ? t("donate.certificate.downloading")
              : t("donate.certificate.download")}
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100"
          >
            <Printer className="h-4 w-4" />
            {t("donate.certificate.print")}
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("donate.certificate.close")}
            className="rounded-lg bg-white p-2 text-gray-600 hover:bg-gray-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Certificate */}
        <div ref={certRef} className="certificate-print bg-white">
          <div className="border-[3px] border-amber-600 p-2">
            <div className="relative overflow-hidden border-4 border-double border-red-800 px-6 py-8 text-center sm:px-12 sm:py-12">
              <Droplet
                className="pointer-events-none absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 text-red-50"
                aria-hidden="true"
              />

              <div className="relative">
                {/* Brand */}
                <div className="flex items-center justify-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-red-700 text-white">
                    <Droplet className="h-6 w-6" />
                  </span>
                  <div className="text-left">
                    <p className="text-lg font-extrabold uppercase tracking-wide text-red-800">
                      {t("donate.certificate.brand")}
                    </p>
                    <p className="text-xs font-semibold text-gray-500">
                      {t("donate.certificate.brandSub")}
                    </p>
                  </div>
                </div>

                <div className="mx-auto mt-6 flex items-center justify-center gap-2 text-red-800">
                  <Award className="h-6 w-6" />
                  <h3 className="font-serif text-2xl font-bold tracking-wide sm:text-3xl">
                    {t("donate.certificate.title")}
                  </h3>
                </div>

                <p className="mt-6 text-sm text-gray-500">
                  {t("donate.certificate.presented")}
                </p>
                <p className="mt-2 font-serif text-3xl font-bold italic text-red-800 sm:text-4xl">
                  {safeData.donorName}
                </p>
                <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-gray-600">
                  {t("donate.certificate.for")}
                </p>

                {/* Details grid */}
                <div className="mx-auto mt-8 grid max-w-2xl grid-cols-2 gap-5 border-y border-gray-200 py-5 sm:grid-cols-4">
                  <InfoBlock
                    label={t("donate.confirm.bloodGroup")}
                    value={safeData.bloodGroup}
                  />
                  <InfoBlock
                    label={t("donate.certificate.date")}
                    value={
                      safeData.time
                        ? `${safeData.date} · ${safeData.time}`
                        : safeData.date
                    }
                  />
                  <InfoBlock
                    label={t("donate.confirm.center")}
                    value={safeData.center}
                  />
                  <InfoBlock
                    label={t("donate.certificate.certNo")}
                    value={safeData.requestId}
                  />
                </div>

                {/* Signatures */}
                <div className="mt-8 flex flex-col items-center justify-between gap-6 sm:flex-row sm:px-6">
                  <div className="w-56 text-center">
                    <div className="border-t border-gray-400 pt-2" />
                    <p className="text-xs font-semibold text-gray-600">
                      {t("donate.certificate.signDonor")}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-[11px] text-gray-400">
                      {t("donate.certificate.issued")}: {issuedOn}
                    </p>
                  </div>
                  <div className="w-56 text-center">
                    <div className="border-t border-gray-400 pt-2" />
                    <p className="text-xs font-semibold text-gray-600">
                      {t("donate.certificate.signAuthority")}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
