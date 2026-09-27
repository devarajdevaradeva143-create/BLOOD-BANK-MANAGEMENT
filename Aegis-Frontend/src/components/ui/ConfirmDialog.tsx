import { useState } from 'react';
import type { ReactNode } from 'react';
import { TriangleAlert } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';
import { useI18n } from '../../i18n/I18nContext';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  destructive?: boolean;
  loading?: boolean;
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel,
  destructive,
  loading,
}: ConfirmDialogProps) {
  const { t } = useI18n();

  return (
    <Modal open={open} onClose={onClose} title={title} size="md">
      <div className="flex gap-4">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
            destructive
              ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400'
              : 'bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400'
          }`}
        >
          <TriangleAlert className="h-5 w-5" />
        </div>
        <p className="pt-1.5 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{message}</p>
      </div>
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="outline" onClick={onClose} disabled={loading}>
          {t('confirm.cancel')}
        </Button>
        <Button variant={destructive ? 'danger' : 'primary'} onClick={onConfirm} loading={loading}>
          {confirmLabel ?? t('confirm.ok')}
        </Button>
      </div>
    </Modal>
  );
}

interface ConfirmState {
  title: string;
  message: string;
  destructive?: boolean;
  confirmLabel?: string;
  onConfirm?: () => void;
}

export function useConfirm(): [ReactNode, (opts: ConfirmState) => void, () => void] {
  const [state, setState] = useState<ConfirmState | null>(null);

  const ask = (opts: ConfirmState) => setState(opts);
  const close = () => setState(null);

  const node = state ? (
    <ConfirmDialog
      open
      onClose={close}
      onConfirm={() => {
        state.onConfirm?.();
        close();
      }}
      title={state.title}
      message={state.message}
      destructive={state.destructive}
      confirmLabel={state.confirmLabel}
    />
  ) : null;

  return [node, ask, close];
}
