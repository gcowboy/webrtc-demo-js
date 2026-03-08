'use client';

import { useClientOptions } from '@/atoms/clientOptions';
import { useLoginMethod } from '@/atoms/loginMethod';
import { fetchNumbersApi } from '@/lib/api';
import { useAuth } from '@clerk/nextjs';
import { useEffect, useRef, useState } from 'react';

export type UseWebRtcTokenResult = {
  isLoading: boolean;
  error: string | null;
};

/**
 * Fetches the WebRTC SIP token from the API and applies it to client options
 * so the Telnyx SDK can auto-connect with token auth. Runs once per mount.
 */
export function useWebRtcToken(): UseWebRtcTokenResult {
  const { getToken } = useAuth();
  const [, setClientOptions] = useClientOptions();
  const [, setLoginMethod] = useLoginMethod();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetched = useRef(false);

  useEffect(() => {
    if (!getToken || fetched.current) {
      setIsLoading(false);
      return;
    }
    fetched.current = true;
    let cancelled = false;

    (async () => {
      try {
        const res = await fetchNumbersApi(getToken, '/numbers/webrtc-token');
        if (cancelled) return;
        if (!res.ok) {
          const msg = (await res.json().catch(() => ({})))?.message ?? res.statusText;
          setError(msg || `Failed to get token (${res.status})`);
          return;
        }
        const { token } = await res.json();
        if (token) {
          setClientOptions((prev) => ({ ...prev, login_token: token }));
          setLoginMethod('token');
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to get WebRTC token');
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [getToken, setClientOptions, setLoginMethod]);

  return { isLoading, error };
}
