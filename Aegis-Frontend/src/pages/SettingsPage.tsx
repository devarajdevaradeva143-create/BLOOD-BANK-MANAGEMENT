import { Languages, Moon, Sun, User } from 'lucide-react';
import type { ReactNode } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useI18n } from '../i18n/I18nContext';
import type { Locale } from '../i18n/I18nContext';
import { Card, CardHeader } from '../components/ui/Card';
import { PageHeader } from '../components/ui/PageHeader';
import { Badge } from '../components/ui/Badge';

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

export default function SettingsPage() {
  const { t, locale, setLocale } = useI18n();
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();

  const languages: { value: Locale; label: string }[] = [
    { value: 'en', label: t('settings.english') },
    { value: 'ta', label: t('settings.tamil') },
  ];

  return (
    <div>
      <PageHeader title={t('settings.title')} subtitle={t('settings.subtitle')} />

      <div className="space-y-5">
        <Card>
          <CardHeader
            icon={<Languages className="h-4.5 w-4.5" />}
            title={t('settings.language')}
            subtitle={t('settings.languageHint')}
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {languages.map((lang) => (
              <OptionCard
                key={lang.value}
                selected={locale === lang.value}
                onClick={() => setLocale(lang.value)}
                icon={<Languages className="h-4.5 w-4.5" />}
                label={lang.label}
              />
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader
            icon={theme === 'dark' ? <Moon className="h-4.5 w-4.5" /> : <Sun className="h-4.5 w-4.5" />}
            title={t('settings.theme')}
            subtitle={t('settings.themeHint')}
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <OptionCard
              selected={theme === 'light'}
              onClick={() => setTheme('light')}
              icon={<Sun className="h-4.5 w-4.5" />}
              label={t('settings.light')}
            />
            <OptionCard
              selected={theme === 'dark'}
              onClick={() => setTheme('dark')}
              icon={<Moon className="h-4.5 w-4.5" />}
              label={t('settings.dark')}
            />
          </div>
        </Card>

        <Card>
          <CardHeader
            icon={<User className="h-4.5 w-4.5" />}
            title={t('settings.profile')}
          />
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-red-600 text-lg font-semibold text-white shadow-sm shadow-red-600/20">
              {user?.name?.trim()?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div className="min-w-0">
              <p className="truncate text-base font-semibold text-slate-900 dark:text-white">
                {user?.name || t('details.noValue')}
              </p>
              <p className="mt-0.5 font-mono text-xs font-medium text-slate-500 dark:text-slate-400">
                {user?.id || t('details.noValue')}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Badge tone="red" dot>
                  {user?.role || t('details.noValue')}
                </Badge>
                <Badge tone="slate">{user?.designation || t('details.noValue')}</Badge>
              </div>
            </div>
          </div>
        </Card>

        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            {t('settings.demoData')}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
            {t('settings.demoDataHint')}
          </p>
        </div>
      </div>
    </div>
  );
}
