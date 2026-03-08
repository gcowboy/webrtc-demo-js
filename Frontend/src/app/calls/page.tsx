'use client';

import type { ICallOptions } from '@/atoms/callOptions';
import { useCallOptions } from '@/atoms/callOptions';
import { useConnectionStatus, useTelnyxSdkClient } from '@/atoms/telnyxClient';
import { useTelnyxNotification } from '@/atoms/telnyxNotification';
import ClientAutoConnect from '@/components/ClientAutoConnect';
import CallNotificationHandler from '@/components/CallNotificationHandler';
import PageLayout from '@/components/PageLayout';
import { useSelectedNumber } from '@/contexts/SelectedNumberContext';
import { useWebRtcToken } from '@/hooks/useWebRtcToken';
import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';

const DIAL_KEYS = [
  { digit: '1' },
  { digit: '2', sub: 'ABC' },
  { digit: '3', sub: 'DEF' },
  { digit: '4', sub: 'GHI' },
  { digit: '5', sub: 'JKL' },
  { digit: '6', sub: 'MNO' },
  { digit: '7', sub: 'PQRS' },
  { digit: '8', sub: 'TUV' },
  { digit: '9', sub: 'WXYZ' },
  { digit: '*' },
  { digit: '0', sub: '+' },
  { digit: '#' },
];

function CallsContent() {
  const { numbers, selectedNumber } = useSelectedNumber();
  const { isLoading, error } = useWebRtcToken();
  const [callOptions, setCallOptions] = useCallOptions();
  const [destinationNumber, setDestinationNumber] = useState('');
  const [client] = useTelnyxSdkClient();
  const [connectionStatus] = useConnectionStatus();
  const [notification] = useTelnyxNotification();

  const selectedItem = useMemo(
    () => numbers.find((n) => n.phone_number === selectedNumber) ?? null,
    [numbers, selectedNumber],
  );
  const profileName = selectedItem?.profile_name?.trim() ?? selectedNumber ?? '';

  const hasActiveCall =
    notification?.call &&
    [
      'active',
      'held',
      'connecting',
      'trying',
      'ringing',
      'requesting',
    ].includes(notification.call.state);

  const onDialKey = useCallback((digit: string) => {
    setDestinationNumber((prev) => prev + digit);
  }, []);

  const onClear = useCallback(() => {
    setDestinationNumber('');
  }, []);

  const onStartCall = useCallback(() => {
    if (hasActiveCall && notification?.call) {
      notification.call.hangup();
      return;
    }
    if (!client) {
      toast.error('Not connected');
      return;
    }
    if (connectionStatus !== 'registered') {
      toast.error('Connecting…');
      return;
    }
    if (!destinationNumber.trim()) {
      toast.error('Enter a number to call');
      return;
    }
    if (!selectedNumber) {
      toast.error('Select a phone number in the sidebar first');
      return;
    }
    const dest = destinationNumber.trim();
    const options: ICallOptions = {
      ...callOptions,
      destinationNumber: dest,
      callerNumber: selectedNumber,
      callerName: profileName || selectedNumber,
    };
    setCallOptions(options);
    try {
      client.newCall(options);
      toast.success(`Calling ${dest}…`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Call failed');
    }
  }, [
    client,
    connectionStatus,
    destinationNumber,
    hasActiveCall,
    notification?.call,
    profileName,
    selectedNumber,
    callOptions,
    setCallOptions,
  ]);

  const canCall =
    connectionStatus === 'registered' &&
    Boolean(selectedNumber) &&
    Boolean(destinationNumber.trim());

  return (
    <div className="main-content">
        <section className="panel inbox-panel">
          <div className="panel-header">
            <h1>Calls</h1>
            <button type="button" className="panel-link">
              View all
            </button>
          </div>
          {error && (
            <p className="text-sm text-destructive px-4 py-2">{error}</p>
          )}
          {isLoading && (
            <p className="text-sm text-muted-foreground px-4 py-2">
              Connecting…
            </p>
          )}
          <div className="thread-list">
            {selectedNumber && (
              <article className="thread selected">
                <div className="thread-main">
                  <h2>{profileName || selectedNumber}</h2>
                  <p>{selectedNumber}</p>
                </div>
                <div className="thread-meta">
                  <span className="status-check">
                    {canCall ? 'Ready' : connectionStatus}
                  </span>
                </div>
              </article>
            )}
          </div>
        </section>

        <section className="panel conversation-panel">
          <header className="conversation-header">
            <div>
              <h2>Call details</h2>
              <p>{profileName ? `${profileName} · ${selectedNumber ?? '—'}` : selectedNumber ?? '—'}</p>
            </div>
            <div className="conversation-actions">
              <button type="button" className="icon-btn" aria-label="Call back">
                📞
              </button>
              <button type="button" className="icon-btn" aria-label="Info">
                ⓘ
              </button>
            </div>
          </header>

          <section className="dialpad" aria-label="Dialpad to call number">
            <div className="dialpad-header">
              <h3>Dialpad</h3>
              <button
                type="button"
                className="panel-link"
                onClick={onClear}
                aria-label="Clear number"
              >
                Clear
              </button>
            </div>
            <label className="dial-input-wrap">
              <span className="sr-only">Phone number</span>
              <input
                type="tel"
                value={destinationNumber}
                onChange={(e) => setDestinationNumber(e.target.value)}
                aria-label="Phone number"
                placeholder="Enter number to call"
              />
            </label>
            <div className="dial-grid" role="group" aria-label="Dial digits">
              {DIAL_KEYS.map(({ digit, sub }) => (
                <button
                  key={digit}
                  type="button"
                  className="dial-key"
                  onClick={() => onDialKey(digit)}
                >
                  {digit}
                  {sub != null ? <span>{sub}</span> : null}
                </button>
              ))}
            </div>
            <button
              type="button"
              className="call-action"
              onClick={onStartCall}
              disabled={!canCall}
              aria-label={hasActiveCall ? 'Hang up' : 'Call'}
            >
              {hasActiveCall ? '📵 Hang up' : '📞 Call'}
            </button>
          </section>
        </section>
      </div>
  );
}

export default function CallsPage() {
  return (
    <PageLayout>
      <ClientAutoConnect />
      <CallNotificationHandler />
      <CallsContent />
    </PageLayout>
  );
}
