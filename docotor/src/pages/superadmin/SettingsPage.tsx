import { useState } from 'react';
import type { ReactNode } from 'react';
import { Bell, Languages, Moon, ShieldCheck, Sun } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTheme } from '../../context/ThemeContext';
import { useI18n } from '../../i18n/I18nContext';
import type { Locale } from '../../i18n/I18nContext';
import type { TranslationKey } from '../../i18n/translations';
import { Card, CardHeader } from '../../components/ui/Card';
import { PageHeader } from '../../components/ui/PageHeader';
import { Field, Select } from '../../components/ui/Input';

interface OptionCardProps {
  selected: boolean;
  onClick: () => void;
  icon: ReactNode;
  label: string;
}

function OptionCard({ selected, onClick, icon, label }: OptionCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`flex w-full items-center gap-3 rounded-xl border p-4 text-left transition cursor-pointer ${
        selected
          ? 'border-red-600 bg-red-50 text-red-600 ring-2 ring-red-600 dark:border-red-500 dark:bg-red-950/40 dark:text-red-300'
          : 'border-slate-200 bg-white text-slate-700 hover:border-red-300 hover:bg-red-50/40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-red-900 dark:hover:bg-red-950/20'
      }`}
    >
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
          selected
            ? 'bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-300'
            : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
        }`}
      >
        {icon}
      </span>
      <span className="text-sm font-semibold">{label}</span>
    </button>
  );
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className={`relative h-6 w-11 shrink-0 rounded-full transition ${
        checked ? 'bg-red-600' : 'bg-slate-300 dark:bg-slate-700'
      }`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
          checked ? 'left-[22px]' : 'left-0.5'
        }`}
      />
    </button>
  );
}

export default function SettingsPage() {
  const { t, locale, setLocale } = useI18n();
  const { theme, setTheme } = useTheme();
  const [notifications, setNotifications] = useState(true);
  const [twoFactor, setTwoFactor] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState('30');

  const saved = () => toast.success(t('admin.settings.saved' as TranslationKey));

  const languages: { value: Locale; label: string }[] = [
    { value: 'en', label: t('settings.english') },
    { value: 'ta', label: t('settings.tamil') },
  ];

  const handleNotificationToggle = () => {
    setNotifications((v) => !v);
    saved();
  };

  const handleTwoFactorToggle = () => {
    setTwoFactor((v) => !v);
    saved();
  };

  const handleTimeoutChange = (value: string) => {
    setSessionTimeout(value);
    saved();
  };

  return (
    <div>
      <PageHeader title={t('admin.settings.title')} subtitle={t('admin.settings.subtitle')} />

      <div className="space-y-5">
        <Card>
          <CardHeader
            icon={theme === 'dark' ? <Moon className="h-4.5 w-4.5" /> : <Sun className="h-4.5 w-4.5" />}
            title={t('admin.settings.appearance')}
            subtitle={t('settings.themeHint')}
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <OptionCard
              selected={theme === 'light'}
              onClick={() => {
                setTheme('light');
                saved();
              }}
              icon={<Sun className="h-4.5 w-4.5" />}
              label={t('settings.light')}
            />
            <OptionCard
              selected={theme === 'dark'}
              onClick={() => {
                setTheme('dark');
                saved();
              }}
              icon={<Moon className="h-4.5 w-4.5" />}
              label={t('settings.dark')}
            />
          </div>
        </Card>

        <Card>
          <CardHeader
            icon={<Languages className="h-4.5 w-4.5" />}
            title={t('admin.settings.language')}
            subtitle={t('settings.languageHint')}
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {languages.map((lang) => (
              <OptionCard
                key={lang.value}
                selected={locale === lang.value}
                onClick={() => {
                  setLocale(lang.value);
                  saved();
                }}
                icon={<Languages className="h-4.5 w-4.5" />}
                label={lang.label}
              />
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader
            icon={<Bell className="h-4.5 w-4.5" />}
            title={t('admin.settings.notifications')}
          />
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
              {t('admin.settings.enableNotifications')}
            </span>
            <Toggle
              checked={notifications}
              onChange={handleNotificationToggle}
              label={t('admin.settings.enableNotifications')}
            />
          </div>
        </Card>

        <Card>
          <CardHeader
            icon={<ShieldCheck className="h-4.5 w-4.5" />}
            title={t('admin.settings.security')}
          />
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                {t('admin.settings.twoFactor')}
              </span>
              <Toggle
                checked={twoFactor}
                onChange={handleTwoFactorToggle}
                label={t('admin.settings.twoFactor')}
              />
            </div>
            <div className="max-w-xs">
              <Field label={t('admin.settings.sessionTimeout')}>
                <Select value={sessionTimeout} onChange={(e) => handleTimeoutChange(e.target.value)}>
                  <option value="15">15</option>
                  <option value="30">30</option>
                  <option value="60">60</option>
                </Select>
              </Field>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
