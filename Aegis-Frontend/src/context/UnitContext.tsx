import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { BloodUnit, NewUnitInput, TestResultInput, UnitStatus } from '../data/types';
import { getStoredDemoUser, saveDemoUnits } from '../data/demo';
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

  const persistIfDemo = useCallback((next: BloodUnit[]) => {
    if (getStoredDemoUser() !== null) saveDemoUnits(next);
  }, []);

  const addUnit = useCallback(async (input: NewUnitInput) => {
    if (getStoredDemoUser() !== null) {
      const at = new Date().toISOString();
      const created = withEffectiveStatus({
        ...input,
        testStatus: 'Pending',
        status: 'UnderTesting',
        updatedAt: at,
        history: [
          { id: `${input.id}-demo-registered`, type: 'registered', at },
          { id: `${input.id}-demo-testing`, type: 'testingStarted', at },
        ],
      });
      setUnits((prev) => {
        const next = [created, ...prev];
        saveDemoUnits(next);
        return next;
      });
      return created;
    }
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
      persistIfDemo(next);
      return next;
    });
    return updated;
  }, [persistIfDemo]);

  const recordTest = useCallback(async (id: string, input: TestResultInput) => {
    if (getStoredDemoUser() !== null) {
      let updated: BloodUnit | undefined;
      const at = new Date().toISOString();
      const nextStatus: UnitStatus = input.testStatus === 'Failed' ? 'Discarded' : 'Available';
      setUnits((prev) => {
        const next = prev.map((u) => {
          if (u.id !== id) return u;
          updated = withEffectiveStatus({
            ...u,
            testStatus: input.testStatus,
            screeningResult: input.screeningResult ?? u.screeningResult,
            testedBy: input.testedBy ?? u.testedBy,
            testDate: input.testDate ?? u.testDate,
            remarks: input.remarks ?? u.remarks,
            status: nextStatus,
            updatedAt: at,
            history: [
              ...u.history,
              { id: `${u.id}-test-${Date.now()}`, type: 'testCompleted', at, status: nextStatus },
            ],
          });
          return updated;
        });
        saveDemoUnits(next);
        return next;
      });
      return updated;
    }
    const updated = withEffectiveStatus(await recordTestApi(id, input));
    setUnits((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
    return updated;
  }, []);

  const updateStatus = useCallback(async (id: string, status: UnitStatus, note?: string) => {
    if (getStoredDemoUser() !== null) {
      let updated: BloodUnit | undefined;
      const at = new Date().toISOString();
      setUnits((prev) => {
        const next = prev.map((u) => {
          if (u.id !== id) return u;
          updated = withEffectiveStatus({
            ...u,
            status,
            updatedAt: at,
            history: [
              ...u.history,
              { id: `${u.id}-status-${Date.now()}`, type: 'statusUpdated', at, status, note },
            ],
          });
          return updated;
        });
        saveDemoUnits(next);
        return next;
      });
      return updated;
    }
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
