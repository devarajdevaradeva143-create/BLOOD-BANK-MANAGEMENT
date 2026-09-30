import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { BloodUnit, NewUnitInput, TestResultInput, UnitStatus } from '../data/types';
import { createUnitApi, listUnits, recordTestApi, updateUnitStatusApi } from '../lib/api';
import { getEffectiveStatus } from '../utils/expiry';
import { useAuth } from './AuthContext';

interface UnitContextValue {
  units: BloodUnit[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  getUnit: (id: string) => BloodUnit | undefined;
  addUnit: (input: NewUnitInput) => Promise<BloodUnit>;
  updateUnit: (id: string, input: Partial<NewUnitInput>) => Promise<BloodUnit | undefined>;
  recordTest: (id: string, input: TestResultInput) => Promise<BloodUnit | undefined>;
  updateStatus: (id: string, status: UnitStatus, note?: string) => Promise<BloodUnit | undefined>;
}

const UnitContext = createContext<UnitContextValue | null>(null);

function withEffectiveStatus(unit: BloodUnit): BloodUnit {
  const effective = getEffectiveStatus(unit);
  return effective === 'Expired' && unit.status !== 'Expired'
    ? { ...unit, status: 'Expired' as UnitStatus }
    : unit;
}

export function UnitProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [units, setUnits] = useState<BloodUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    // Always real backend data — no mock fallback. Failure surfaces as error.
    setLoading(true);
    setError(null);
    try {
      const result = await listUnits({ page: 1, limit: 100 });
      setUnits(result.data.map(withEffectiveStatus));
    } catch (err) {
      setUnits([]);
      setError(err instanceof Error ? err.message : 'Failed to load blood units');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) {
      setUnits([]);
      setError(null);
      setLoading(false);
      return;
    }
    void refresh();
  }, [user, refresh]);

  const getUnit = useCallback((id: string) => units.find((u) => u.id === id), [units]);

  const addUnit = useCallback(async (input: NewUnitInput) => {
    // Real backend only — no offline demo creation.
    const { id, ...rest } = input;
    const created = withEffectiveStatus(await createUnitApi({ unitCode: id, ...rest }));
    setUnits((prev) => [created, ...prev]);
    return created;
  }, []);

  const updateUnit = useCallback(async (id: string, input: Partial<NewUnitInput>) => {
    // The backend exposes no generic unit-update endpoint (only status/test
    // transitions), so edits are applied to the local copy. They will be
    // replaced by server data on the next refresh.
    let updated: BloodUnit | undefined;
    const at = new Date().toISOString();
    const { id: _ignoredId, ...fields } = input;
    setUnits((prev) => {
      const next = prev.map((u) => {
        if (u.id !== id) return u;
        updated = {
          ...u,
          ...fields,
          updatedAt: at,
          history: [
            ...u.history,
            { id: `${u.id}-edit-${Date.now()}`, type: 'statusUpdated', at },
          ],
        };
        return updated;
      });
      return next;
    });
    return updated;
  }, []);

  const recordTest = useCallback(async (id: string, input: TestResultInput) => {
    // Real backend only — no offline demo test recording.
    const updated = withEffectiveStatus(await recordTestApi(id, input));
    setUnits((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
    return updated;
  }, []);

  const updateStatus = useCallback(async (id: string, status: UnitStatus, note?: string) => {
    // Real backend only — no offline demo status updates.
    const updated = withEffectiveStatus(await updateUnitStatusApi(id, status, note));
    setUnits((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
    return updated;
  }, []);

  const value = useMemo(
    () => ({ units, loading, error, refresh, getUnit, addUnit, updateUnit, recordTest, updateStatus }),
    [units, loading, error, refresh, getUnit, addUnit, updateUnit, recordTest, updateStatus],
  );

  return <UnitContext.Provider value={value}>{children}</UnitContext.Provider>;
}

export function useUnits(): UnitContextValue {
  const ctx = useContext(UnitContext);
  if (!ctx) throw new Error('useUnits must be used within UnitProvider');
  return ctx;
}
