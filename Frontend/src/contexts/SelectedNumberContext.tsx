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

export type NumberItem = { phone_number: string; id: string; profile_name?: string | null };

type ContextValue = {
  numbers: NumberItem[];
  selectedNumber: string | null;
  setSelectedNumber: (phoneNumber: string) => void;
  loading: boolean;
  refresh: () => Promise<void>;
};

const SelectedNumberContext = createContext<ContextValue | null>(null);

const SELECTED_NUMBER_STORAGE_KEY = 'selected-phone-number';

function readStoredNumber(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return sessionStorage.getItem(SELECTED_NUMBER_STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeStoredNumber(phoneNumber: string) {
  try {
    sessionStorage.setItem(SELECTED_NUMBER_STORAGE_KEY, phoneNumber);
  } catch {
    // ignore
  }
}

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
      const items: NumberItem[] = list.map((n: { phone_number?: string; id?: string; profile_name?: string | null }) => ({
        phone_number: n.phone_number ?? '',
        id: n.id ?? '',
        profile_name: n.profile_name ?? null,
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

  // When numbers list changes, restore from storage or keep selectedNumber in sync
  useEffect(() => {
    if (numbers.length === 0) return;
    const stored = readStoredNumber();
    const storedIsValid = stored && numbers.some((n) => n.phone_number === stored);
    setSelectedNumberState((current) => {
      if (storedIsValid) return stored;
      if (!current || !numbers.some((n) => n.phone_number === current)) {
        const fallback = numbers[0].phone_number;
        writeStoredNumber(fallback);
        return fallback;
      }
      return current;
    });
  }, [numbers]);

  const setSelectedNumber = useCallback((phoneNumber: string) => {
    setSelectedNumberState(phoneNumber);
    writeStoredNumber(phoneNumber);
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
