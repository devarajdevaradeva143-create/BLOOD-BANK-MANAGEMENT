import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDonorAuth } from "../context/DonorAuthContext";
import { useLanguage } from "../i18n/LanguageContext";
import { MOCK_DONOR } from "../data/constants";
import ProfileAvatar from "../components/profile/ProfileAvatar";
import ProfileSummaryCard from "../components/profile/ProfileSummaryCard";
import PersonalInfoSection from "../components/profile/PersonalInfoSection";
import DonationInfoSection from "../components/profile/DonationInfoSection";
import Button from "../components/ui/Button";

export default function ProfilePage() {
  const { logout } = useDonorAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [donor, setDonor] = useState(MOCK_DONOR);
  const [editing, setEditing] = useState(false);
  const [errors, setErrors] = useState({});
  const [saved, setSaved] = useState(false);

  const handleChange = (field, value) => {
    setDonor((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
    setSaved(false);
  };

  const validate = () => {
    const newErrors = {};
    if (!donor.name.trim()) newErrors.name = t("profile.validation.name");
    if (!donor.email.trim() || !/\S+@\S+\.\S+/.test(donor.email))
      newErrors.email = t("profile.validation.email");
    if (!donor.phone.trim() || !/^[0-9]{10}$/.test(donor.phone))
      newErrors.phone = t("profile.validation.phone");
    if (!donor.gender) newErrors.gender = t("profile.validation.gender");
    if (!donor.bloodGroup) newErrors.bloodGroup = t("profile.validation.bloodGroup");
    if (!donor.address.trim()) newErrors.address = t("profile.validation.address");
    if (!donor.district) newErrors.district = t("profile.validation.district");
    return newErrors;
  };

  const handleSave = () => {
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    try {
      localStorage.setItem("registeredDonor", JSON.stringify(donor));
    } catch {
      // ignore
    }
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
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

      <div className="mb-8">
        <ProfileSummaryCard donor={donor} t={t} />
      </div>

      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        {!editing ? (
          <Button onClick={() => setEditing(true)} variant="outline">
            {t("profile.edit")}
          </Button>
        ) : (
          <div className="flex gap-3">
            <Button onClick={handleSave} variant="primary">
              {t("profile.save")}
            </Button>
            <Button
              onClick={() => {
                setEditing(false);
                setErrors({});
                setSaved(false);
              }}
              variant="outline"
            >
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
        />
      </div>

      <div className="mb-8">
        <DonationInfoSection donor={donor} t={t} />
      </div>
    </div>
  );
}
