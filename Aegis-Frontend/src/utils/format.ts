const MS_PER_MINUTE = 60_000;
const MS_PER_HOUR = 3_600_000;

export function formatDateTime(iso: string, locale: string): string {
  const date = new Date(iso);
  return date.toLocaleString(locale === 'ta' ? 'ta-IN' : 'en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

export function formatDate(dateStr: string, locale: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, (m || 1) - 1, d || 1);
  return date.toLocaleDateString(locale === 'ta' ? 'ta-IN' : 'en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function relativeTime(iso: string, locale: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const abs = Math.abs(diff);
  const rtf = new Intl.RelativeTimeFormat(locale === 'ta' ? 'ta-IN' : 'en-IN', {
    numeric: 'auto',
  });
  if (abs < MS_PER_MINUTE) return rtf.format(diff > 0 ? 0 : 0, 'minute');
  if (abs < MS_PER_HOUR) return rtf.format(Math.round(diff / MS_PER_MINUTE), 'minute');
  if (abs < 86_400_000) return rtf.format(Math.round(diff / MS_PER_HOUR), 'hour');
  if (abs < 2_592_000_000) return rtf.format(Math.round(diff / 86_400_000), 'day');
  return formatDate(iso.slice(0, 10), locale);
}

export function todayISO(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}
