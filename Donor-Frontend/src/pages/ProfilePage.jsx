import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Award, Download } from "lucide-react";
import { useDonorAuth } from "../context/DonorAuthContext";
import { useLanguage } from "../i18n/LanguageContext";
import ProfileSummaryCard from "../components/profile/ProfileSummaryCard";
import PersonalInfoSection from "../components/profile/PersonalInfoSection";
import DonationInfoSection from "../components/profile/DonationInfoSection";
import Certificate from "../components/donate/Certificate";
import Button from "../components/ui/Button";

function loadDonationHistory() {
  try {
    const hRaw = localStorage.getItem("donorDonations");
    const hist = hRaw ? JSON.parse(hRaw) : [];
    if (!Array.isArray(hist)) return [];
    // Admin removed — pazhaya pending entries-ah approved-ah migrate pannu.
    let changed = false;
    const fixed = hist.map((h) => {
      if (h && h.status && h.status !== "approved") {
        changed = true;
        return { ...h, status: "approved" };
      }
      return h;
    });
    if (changed) {
      try {
        localStorage.setItem("donorDonations", JSON.stringify(fixed));
      } catch {
        // ignore
      }
    }
    return fixed;
  } catch {
    return [];
  }
}

const EMPTY_DONOR = {
  name: "",
  email: "",
  phone: "",
  password: "",
  dob: "",
  gender: "",
  bloodGroup: "",
  address: "",
  district: "",
  donorId: "",
  photo: "",
  registrationDate: "",
  lastDonationDate: "",
  totalDonations: 0,
  eligibilityStatus: "",
  nextEligibleDate: "",
  isActive: true,
};

function genDonorId() {
  const year = new Date().getFullYear();
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `DB-${year}${rand}`;
}

function loadRealDonor(fallbackEmail = "") {
  // Fake data vendaam — registeredDonor + donorDonations history mattum source.
  try {
    const raw = localStorage.getItem("registeredDonor");
    const reg =
      raw && JSON.parse(raw) && typeof JSON.parse(raw) === "object"
        ? JSON.parse(raw)
        : null;
    let histTotal = 0;
    let histLast = "";
    try {
      const hRaw = localStorage.getItem("donorDonations");
      const hist = hRaw ? JSON.parse(hRaw) : [];
      if (Array.isArray(hist) && hist.length > 0) {
        // Approve aana donations mattum count — pending/rejected count agadhu.
        // status illadha pazhaya entries approved madhiri.
        const approved = hist.filter((h) => (h?.status || "approved") === "approved");
        histTotal = approved.length;
        histLast = approved.length > 0 ? approved[approved.length - 1]?.date || "" : "";
      }
    } catch {
      // ignore
    }
    if (!reg) {
      return {
        ...EMPTY_DONOR,
        email: fallbackEmail || "",
        totalDonations: histTotal,
        lastDonationDate: histLast,
      };
    }
    const storedTotal = Number(reg.totalDonations ?? 0) || 0;
    return {
      ...EMPTY_DONOR,
      ...reg,
      name: reg.name || "",
      email: reg.email || fallbackEmail || "",
      phone: reg.phone || reg.mobile || "",
      password: reg.password || "",
      dob: reg.dob || "",
      gender: reg.gender || "",
      bloodGroup: reg.bloodGroup || "",
      address: reg.address || "",
      district: reg.district || "",
      donorId: reg.donorId || "",
      photo: reg.photo || reg.photoUrl || reg.avatar || "",
      registrationDate: reg.registrationDate || "",
      lastDonationDate: reg.lastDonationDate || histLast || "",
      // History irundha adhuvum count pannu — 0 issue varadhu.
      totalDonations: Math.max(storedTotal, histTotal),
      eligibilityStatus: reg.eligibilityStatus || "",
      nextEligibleDate: reg.nextEligibleDate || "",
      isActive: reg.isActive ?? true,
    };
  } catch {
    return { ...EMPTY_DONOR, email: fallbackEmail || "" };
  }
}

function isProfileIncomplete(donor) {
  return (
    !String(donor.name || "").trim() ||
    !String(donor.email || "").trim() ||
    !String(donor.phone || "").trim() ||
    !donor.gender ||
    !donor.bloodGroup ||
    !String(donor.address || "").trim() ||
    !donor.district
  );
}

export default function ProfilePage() {
  const { logout, donorEmail, login } = useDonorAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [donor, setDonor] = useState(() => loadRealDonor(donorEmail));
  const [snapshot, setSnapshot] = useState(() => loadRealDonor(donorEmail));
  // Profile incomplete-ah irundha direct-ah edit mode-la open pannu.
  const [editing, setEditing] = useState(() =>
    isProfileIncomplete(loadRealDonor(donorEmail))
  );
  const [errors, setErrors] = useState({});
  const [saved, setSaved] = useState(false);
  const showEmptyHint = !String(donor.name || "").trim() && !editing;

  const handleChange = (field, value) => {
    setDonor((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
    setSaved(false);
  };

  // Profile photo set panna udane state + localStorage-la save aagum.
  const handlePhotoChange = (dataUrl) => {
    setDonor((prev) => ({ ...prev, photo: dataUrl }));
    setSaved(false);
    try {
      const raw = localStorage.getItem("registeredDonor");
      const reg = raw ? JSON.parse(raw) : {};
      localStorage.setItem(
        "registeredDonor",
        JSON.stringify({ ...reg, photo: dataUrl })
      );
    } catch {
      // ignore storage errors
    }
  };

  const validate = () => {
    // Editable 4 fields mattum validate pannu — read-only fields block panna koodadhu.
    const newErrors = {};
    if (
      !String(donor.email || "").trim() ||
      !/\S+@\S+\.\S+/.test(String(donor.email || ""))
    )
      newErrors.email = t("profile.validation.email");
    if (
      !String(donor.phone || "").trim() ||
      !/^[0-9]{10}$/.test(String(donor.phone || ""))
    )
      newErrors.phone = t("profile.validation.phone");
    if (!donor.district) newErrors.district = t("profile.validation.district");
    if (!String(donor.address || "").trim())
      newErrors.address = t("profile.validation.address");
    return newErrors;
  };

  const handleSave = () => {
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    // donorId + registrationDate illana ippo generate panni real-ah save pannu.
    const toSave = {
      ...donor,
      donorId: donor.donorId || genDonorId(),
      registrationDate:
        donor.registrationDate || new Date().toISOString().slice(0, 10),
      totalDonations: Number(donor.totalDonations ?? 0) || 0,
    };
    try {
      localStorage.setItem("registeredDonor", JSON.stringify(toSave));
    } catch {
      // ignore
    }
    // Email maathuna auth context-um sync pannu.
    try {
      if (
        String(toSave.email || "").trim().toLowerCase() !==
        String(donorEmail || "").trim().toLowerCase()
      ) {
        login(String(toSave.email || "").trim().toLowerCase());
      }
    } catch {
      // ignore
    }
    setDonor(toSave);
    setSnapshot(toSave);
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleCancel = () => {
    // Edit cancel panna last saved data-ku revert aagum.
    setDonor(snapshot);
    setEditing(false);
    setErrors({});
    setSaved(false);
  };

  const [history, setHistory] = useState(loadDonationHistory);
  const [certData, setCertData] = useState(null);

  useEffect(() => {
    const refresh = () => {
      setHistory(loadDonationHistory());
    };
    window.addEventListener("storage", refresh);
    window.addEventListener("focus", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, []);

  const openCertificate = (h) => {
    // Certificate open panna munnadi fresh history-ah re-read pannu.
    let fresh = h;
    try {
      const hRaw = localStorage.getItem("donorDonations");
      const hist = hRaw ? JSON.parse(hRaw) : [];
      if (Array.isArray(hist) && h && h.requestId) {
        const found = hist.find((x) => x && x.requestId === h.requestId);
        if (found) fresh = found;
      }
    } catch {
      // ignore, fallback to passed entry
    }
    // History-la missing fields-irundha profile data-va merge pannu.
    setCertData({
      requestId: fresh.requestId || `CERT-${Date.now()}`,
      donorName: fresh.donorName || donor.name || "Donor",
      bloodGroup: fresh.bloodGroup || donor.bloodGroup || "—",
      mobile: fresh.mobile || donor.phone || "",
      center: fresh.center || "Life Saver Blood Bank",
      date: fresh.date || new Date().toISOString().slice(0, 10),
      time: fresh.time || "",
    });
  };

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
          {t("profile.page.title")}
        </h1>
        <p className="mt-2 text-base text-gray-600 dark:text-slate-400">
          {t("profile.page.subtitle")}
        </p>
      </div>

      {saved && (
        <div className="mb-4 rounded-lg bg-emerald-50 p-4 text-sm font-medium text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300" role="status">
          {t("profile.success")}
        </div>
      )}

      {showEmptyHint && (
        <div className="mb-4 rounded-lg bg-amber-50 p-4 text-sm font-medium text-amber-800 dark:bg-amber-950/40 dark:text-amber-300" role="status">
          {t("profile.cert.incomplete")}
        </div>
      )}

      <div className="mb-8">
        <ProfileSummaryCard
          donor={donor}
          t={t}
          editablePhoto
          onPhotoChange={handlePhotoChange}
        />
      </div>

      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        {!editing ? (
          <Button
            onClick={() => {
              setSnapshot(donor);
              setEditing(true);
            }}
            variant="outline"
          >
            {t("profile.edit")}
          </Button>
        ) : (
          <div className="flex gap-3">
            <Button onClick={handleSave} variant="primary">
              {t("profile.save")}
            </Button>
            <Button onClick={handleCancel} variant="outline">
              {t("profile.cancel")}
            </Button>
          </div>
        )}
        <Button onClick={handleLogout} variant="light">
          {t("profile.logout")}
        </Button>
      </div>

      <div className="mb-8">
        <PersonalInfoSection
          donor={donor}
          editing={editing}
          onChange={handleChange}
          errors={errors}
          t={t}
        />
      </div>

      <div className="mb-8">
        <DonationInfoSection donor={donor} t={t} />
      </div>

      {/* Donation history + certificate download */}
      <div className="mb-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white">
          <Award className="h-5 w-5 text-brand-600" />
          {t("profile.cert.title")}
        </h3>
        {history.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-slate-400">
            {t("profile.cert.empty")}
          </p>
        ) : (
          <div className="space-y-3">
            {history
              .slice()
              .reverse()
              .map((h, i) => {
                const district = h.district || "—";
                return (
                  <div
                    key={h.requestId || i}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-slate-800 dark:bg-slate-950"
                  >
                    <div>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">
                        {h.date || "—"} {h.time ? `· ${h.time}` : ""} —{" "}
                        {h.bloodGroup || donor.bloodGroup || ""}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-slate-400">
                        {h.requestId || ""} · {h.center || ""}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-slate-400">
                        {t("profile.cert.district")}: {district}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => openCertificate(h)}
                      className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
                    >
                      <Download className="h-4 w-4" />
                      {t("profile.cert.button")}
                    </button>
                  </div>
                );
              })}
          </div>
        )}
      </div>

      {certData && (
        <Certificate data={certData} onClose={() => setCertData(null)} />
      )}
    </div>
  );
}
