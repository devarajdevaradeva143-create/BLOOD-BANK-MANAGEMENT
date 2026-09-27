import type { ExpiryStatus, UnitStatus, BloodUnit } from '../data/types';

export const MS_PER_DAY = 86_400_000;

export function parseDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function daysRemaining(expiryDate: string): number {
  const today = startOfDay(new Date());
  const expiry = startOfDay(parseDate(expiryDate));
  return Math.round((expiry.getTime() - today.getTime()) / MS_PER_DAY);
}

export function getExpiryStatus(unit: Pick<BloodUnit, 'expiryDate'>): ExpiryStatus {
  const d = daysRemaining(unit.expiryDate);
  if (d < 0) return 'Expired';
  if (d <= 7) return 'ExpiringSoon';
  return 'Safe';
}

const TERMINAL: UnitStatus[] = ['Used', 'Discarded'];

export function getEffectiveStatus(unit: BloodUnit): UnitStatus {
  if (TERMINAL.includes(unit.status)) return unit.status;
  if (daysRemaining(unit.expiryDate) < 0) return 'Expired';
  if (unit.status === 'Expired') {
    return unit.testStatus === 'Passed' ? 'Available' : 'UnderTesting';
  }
  return unit.status;
}

export function isEffectivelyExpired(unit: BloodUnit): boolean {
  return getEffectiveStatus(unit) === 'Expired';
}

export function isExpiringSoon(unit: BloodUnit): boolean {
  const d = daysRemaining(unit.expiryDate);
  return d >= 0 && d <= 7 && !TERMINAL.includes(unit.status);
}

export function canBeAvailable(unit: BloodUnit): boolean {
  return (
    !TERMINAL.includes(unit.status) &&
    daysRemaining(unit.expiryDate) >= 0 &&
    unit.testStatus === 'Passed'
  );
}
