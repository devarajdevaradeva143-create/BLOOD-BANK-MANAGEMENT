import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import toast from 'react-hot-toast';
import { Check, Eye, Search, X } from 'lucide-react';
import { useI18n } from '../../i18n/I18nContext';
import { REQUESTS } from '../../data/superadminMock';
import type { BloodRequestRow } from '../../data/superadminMock';
import { DISTRICTS } from '../../data/constants';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { EmptyState } from '../../components/ui/EmptyState';

type Tab = 'all' | 'pending' | 'approved' | 'rejected';
type PriorityFilter = 'all' | 'emergency' | 'normal';

const th =
  'px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400';

function statusTone(status: BloodRequestRow['status']): 'amber' | 'emerald' | 'rose' {
  if (status === 'approved') return 'emerald';
  if (status === 'rejected') return 'rose';
  return 'amber';
}

export default function RequestsPage() {
  const { t } = useI18n();
  const [rows, setRows] = useState<BloodRequestRow[]>(REQUESTS);
  const [tab, setTab] = useState<Tab>('all');
  const [search, setSearch] = useState('');
  const [district, setDistrict] = useState('');
  const [priority, setPriority] = useState<PriorityFilter>('all');
  const [selected, setSelected] = useState<BloodRequestRow | null>(null);

  const base = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (q && !r.id.toLowerCase().includes(q) && !r.hospital.toLowerCase().includes(q))
        return false;
      if (district && r.district !== district) return false;
      if (priority !== 'all' && r.priority !== priority) return false;
      return true;
    });
  }, [rows, search, district, priority]);

  const counts = useMemo(
    () => ({
      all: base.length,
      pending: base.filter((r) => r.status === 'pending').length,
      approved: base.filter((r) => r.status === 'approved').length,
      rejected: base.filter((r) => r.status === 'rejected').length,
    }),
    [base],
  );

  const filtered = useMemo(
    () => (tab === 'all' ? base : base.filter((r) => r.status === tab)),
    [base, tab],
  );

  const statusLabel = (s: BloodRequestRow['status']) =>
    s === 'pending'
      ? t('admin.requests.pending')
      : s === 'approved'
        ? t('admin.requests.approved')
        : t('admin.requests.rejected');

  const updateStatus = (id: string, next: 'approved' | 'rejected') => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status: next } : r)));
    setSelected((prev) => (prev && prev.id === id ? { ...prev, status: next } : prev));
    toast.success(
      `${id} · ${next === 'approved' ? t('admin.requests.approved') : t('admin.requests.rejected')}`,
    );
  };

  const emergencyBadge = (
    <Badge tone="rose" className="mt-1">
      {t('admin.requests.emergency')}
    </Badge>
  );

  const detailRow = (label: string, value: ReactNode) => (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <dt className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</dt>
      <dd className="text-right text-sm font-medium text-slate-900 dark:text-white">{value}</dd>
    </div>
  );

  const renderActions = (row: BloodRequestRow) => (
    <div className="flex items-center justify-end gap-1.5">
      {row.status === 'pending' ? (
        <>
          <Button size="sm" variant="success" icon={<Check className="h-3.5 w-3.5" />} onClick={() => updateStatus(row.id, 'approved')}>
            Approve
          </Button>
          <Button size="sm" variant="danger" icon={<X className="h-3.5 w-3.5" />} onClick={() => updateStatus(row.id, 'rejected')}>
            Reject
          </Button>
        </>
      ) : null}
      <Button variant="outline" size="sm" icon={<Eye className="h-3.5 w-3.5" />} onClick={() => setSelected(row)}>
        {t('admin.table.view')}
      </Button>
    </div>
  );

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: 'all', label: t('admin.table.allStatus'), count: counts.all },
    { key: 'pending', label: t('admin.requests.pending'), count: counts.pending },
    { key: 'approved', label: t('admin.requests.approved'), count: counts.approved },
    { key: 'rejected', label: t('admin.requests.rejected'), count: counts.rejected },
  ];

  return (
    <div>
      <PageHeader title={t('admin.requests.title')} subtitle={t('admin.requests.subtitle')} />

      <Card>
        <div className="flex flex-wrap gap-2">
          {tabs.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setTab(item.key)}
              className={`inline-flex h-8 items-center gap-1.5 rounded-full px-3.5 text-xs font-medium transition ${
                tab === item.key
                  ? 'bg-red-600 text-white shadow-sm shadow-red-600/20'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
              }`}
            >
              {item.label}
              <span
                className={`rounded-full px-1.5 py-0.5 text-[11px] font-semibold ${
                  tab === item.key
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                }`}
              >
                {item.count}
              </span>
            </button>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap items-end gap-3">
          <div className="w-full min-w-[180px] flex-1 sm:w-auto">
            <label
              htmlFor="request-search"
              className="block text-xs font-medium text-slate-600 dark:text-slate-300"
            >
              {t('common.search')}
            </label>
            <div className="relative mt-1.5">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                id="request-search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('admin.table.searchPh')}
                className="pl-9"
                aria-label={t('admin.table.searchPh')}
              />
            </div>
          </div>

          <div className="min-w-[150px] flex-1 sm:flex-none">
            <label
              htmlFor="request-district"
              className="block text-xs font-medium text-slate-600 dark:text-slate-300"
            >
              {t('admin.donors.district')}
            </label>
            <Select
              id="request-district"
              className="mt-1.5"
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
            >
              <option value="">{t('admin.table.allDistricts')}</option>
              {DISTRICTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </Select>
          </div>

          <div className="min-w-[150px] flex-1 sm:flex-none">
            <label
              htmlFor="request-priority"
              className="block text-xs font-medium text-slate-600 dark:text-slate-300"
            >
              {t('admin.requests.type')}
            </label>
            <Select
              id="request-priority"
              className="mt-1.5"
              value={priority}
              onChange={(e) => setPriority(e.target.value as PriorityFilter)}
            >
              <option value="all">{t('admin.table.allStatus')}</option>
              <option value="emergency">{t('admin.requests.emergency')}</option>
              <option value="normal">{t('admin.requests.normal')}</option>
            </Select>
          </div>
        </div>
      </Card>

      <Card padded={false} className="mt-4 overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState title={t('admin.table.noResults')} hint={t('admin.table.noResultsHint')} />
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50">
                    <th className={th}>{t('admin.requests.requestId')}</th>
                    <th className={th}>{t('admin.requests.hospital')}</th>
                    <th className={th}>{t('admin.donors.district')}</th>
                    <th className={th}>{t('admin.requests.group')}</th>
                    <th className={th}>{t('admin.requests.units')}</th>
                    <th className={th}>{t('admin.requests.date')}</th>
                    <th className={th}>{t('common.status')}</th>
                    <th className={`${th} text-right`}>{t('admin.table.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white dark:divide-slate-800 dark:bg-slate-900">
                  {filtered.map((row) => (
                    <tr
                      key={row.id}
                      className={`transition hover:bg-slate-50 dark:hover:bg-slate-800/50 ${
                        row.priority === 'emergency'
                          ? 'border-l-4 border-l-rose-500 bg-rose-50/50 dark:bg-rose-950/20'
                          : ''
                      }`}
                    >
                      <td className="whitespace-nowrap px-4 py-3">
                        <span className="block font-mono text-sm font-semibold text-slate-900 dark:text-white">
                          {row.id}
                        </span>
                        {row.priority === 'emergency' ? emergencyBadge : null}
                      </td>
                      <td className="max-w-[220px] truncate px-4 py-3 text-sm font-medium text-slate-900 dark:text-white">
                        {row.hospital}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-700 dark:text-slate-300">
                        {row.district}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <Badge tone="red">{row.group}</Badge>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-700 dark:text-slate-300">
                        {row.units}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-700 dark:text-slate-300">
                        {row.date}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <Badge tone={statusTone(row.status)}>{statusLabel(row.status)}</Badge>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">{renderActions(row)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-slate-100 md:hidden dark:divide-slate-800">
              {filtered.map((row) => (
                <div
                  key={row.id}
                  className={`p-4 ${
                    row.priority === 'emergency'
                      ? 'border-l-4 border-l-rose-500 bg-rose-50/50 dark:bg-rose-950/20'
                      : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="font-mono text-sm font-semibold text-slate-900 dark:text-white">
                      {row.id}
                    </span>
                    <Badge tone={statusTone(row.status)}>{statusLabel(row.status)}</Badge>
                  </div>
                  {row.priority === 'emergency' ? <div>{emergencyBadge}</div> : null}
                  <p className="mt-1.5 text-sm font-medium text-slate-900 dark:text-white">
                    {row.hospital}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <Badge tone="red">{row.group}</Badge>
                  </div>
                  <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
                    {row.district} · {t('admin.requests.units')}: {row.units} ·{' '}
                    {t('admin.requests.date')}: {row.date}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1.5">{renderActions(row)}</div>
                </div>
              ))}
            </div>

            <div className="border-t border-slate-200 px-4 py-3 text-xs font-medium text-slate-500 dark:border-slate-800 dark:text-slate-400">
              {t('admin.table.showing', { count: filtered.length, total: rows.length })}
            </div>
          </>
        )}
      </Card>

      <Modal
        open={selected !== null}
        onClose={() => setSelected(null)}
        title={selected?.id ?? ''}
        subtitle={selected?.hospital ?? ''}
        footer={
          <Button variant="outline" onClick={() => setSelected(null)}>
            {t('common.close')}
          </Button>
        }
      >
        {selected ? (
          <dl className="divide-y divide-slate-100 dark:divide-slate-800">
            {detailRow(t('admin.requests.hospital'), selected.hospital)}
            {detailRow(t('admin.donors.district'), selected.district)}
            {detailRow(t('admin.requests.group'), <Badge tone="red">{selected.group}</Badge>)}
            {detailRow(t('admin.requests.units'), selected.units)}
            {detailRow(t('admin.requests.date'), selected.date)}
            {detailRow(
              t('admin.requests.type'),
              selected.priority === 'emergency' ? (
                <Badge tone="rose">{t('admin.requests.emergency')}</Badge>
              ) : (
                t('admin.requests.normal')
              ),
            )}
            {detailRow(
              t('common.status'),
              <Badge tone={statusTone(selected.status)}>{statusLabel(selected.status)}</Badge>,
            )}
          </dl>
        ) : null}
      </Modal>
    </div>
  );
}
