'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { useAuth } from '@clerk/nextjs';
import { fetchNumbersApi } from '@/lib/api';

export type NumberItem = { phone_number: string; id: string };

type ContextValue = {
  numbers: NumberItem[];
  selectedNumber: string | null;
  setSelectedNumber: (phoneNumber: string) => void;
  loading: boolean;
  refresh: () => Promise<void>;
};

const SelectedNumberContext = createContext<ContextValue | null>(null);

export function SelectedNumberProvider({ children }: { children: ReactNode }) {
  const { getToken } = useAuth();
  const [numbers, setNumbers] = useState<NumberItem[]>([]);
  const [selectedNumber, setSelectedNumberState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!getToken) {
      setNumbers([]);
      setSelectedNumberState(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetchNumbersApi(getToken, '/numbers/mine');
      if (!res.ok) throw new Error(res.statusText);
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      const items: NumberItem[] = list.map((n: { phone_number?: string; id?: string }) => ({
        phone_number: n.phone_number ?? '',
        id: n.id ?? '',
      }));
      setNumbers(items);
      if (items.length === 0) {
        setSelectedNumberState(null);
      }
    } catch {
      setNumbers([]);
      setSelectedNumberState(null);
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    load();
  }, [load]);

  // When numbers list changes, keep selectedNumber in sync (e.g. after refresh or if selection was removed)
  useEffect(() => {
    if (numbers.length === 0) return;
    setSelectedNumberState((current) => {
      if (!current || !numbers.some((n) => n.phone_number === current)) {
        return numbers[0].phone_number;
      }
      return current;
    });
  }, [numbers]);

  const setSelectedNumber = useCallback((phoneNumber: string) => {
    setSelectedNumberState(phoneNumber);
  }, []);

  const value: ContextValue = {
    numbers,
    selectedNumber,
    setSelectedNumber,
    loading,
    refresh: load,
  };

  return (
    <SelectedNumberContext.Provider value={value}>
      {children}
    </SelectedNumberContext.Provider>
  );
}

export function useSelectedNumber(): ContextValue {
  const ctx = useContext(SelectedNumberContext);
  if (!ctx) {
    return {
      numbers: [],
      selectedNumber: null,
      setSelectedNumber: () => {},
      loading: false,
      refresh: async () => {},
    };
  }
  return ctx;
}
