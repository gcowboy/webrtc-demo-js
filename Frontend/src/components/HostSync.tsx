'use client';

import { useEffect } from 'react';
import { useSetAtom } from 'jotai';
import { hostAtom } from '@/atoms/host';

/** Syncs host atom from URL search params on client (Next.js hydration). */
export default function HostSync() {
  const setHost = useSetAtom(hostAtom);

  useEffect(() => {
    const host =
      new URLSearchParams(window.location.search).get('host') ??
      process.env.NEXT_PUBLIC_RTC_HOST ??
      '';
    setHost(host);
  }, [setHost]);

  return null;
}
