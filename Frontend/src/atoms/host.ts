import { atom, useAtom } from 'jotai';

// SSR-safe: default from env; client can override from URL via HostSync
const getInitialHost = () =>
  typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('host') ??
      process.env.NEXT_PUBLIC_RTC_HOST ??
      ''
    : process.env.NEXT_PUBLIC_RTC_HOST ?? '';

export const hostAtom = atom<string>(getInitialHost());
export const useHost = () => useAtom(hostAtom);
