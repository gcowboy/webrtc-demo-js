// Next.js: use NODE_ENV (inlined at build time) and NEXT_PUBLIC_* for client env
export const IS_DEV_MODE = process.env.NODE_ENV === 'development';
export const IS_PROD_MODE = process.env.NODE_ENV === 'production';
export const IS_DEV_ENV = process.env.NODE_ENV === 'development';
export const IS_PROD_ENV = process.env.NODE_ENV === 'production';

export const getRtcHost = () =>
  (typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('host') ?? undefined
    : undefined) ?? process.env.NEXT_PUBLIC_RTC_HOST ?? '';

export const getSipHost = () =>
  process.env.NEXT_PUBLIC_SIP_HOST || 'sip.telnyx.com';
