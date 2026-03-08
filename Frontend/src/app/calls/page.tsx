'use client';

import CallHistory from '@/components/CallHistory';
import CallNotificationHandler from '@/components/CallNotificationHandler';
import CallOptions from '@/components/CallOptions';
import ClientAutoConnect from '@/components/ClientAutoConnect';
import ConnectionStatus from '@/components/ConnectionStatus';
import Dialer from '@/components/Dialer';
import PageLayout from '@/components/PageLayout';
import { useSelectedNumber } from '@/contexts/SelectedNumberContext';
import { useWebRtcToken } from '@/hooks/useWebRtcToken';

const CallsPage = () => {
  const { selectedNumber } = useSelectedNumber();
  const { isLoading, error } = useWebRtcToken();

  return (
    <PageLayout>
      <section className="panel inbox-panel p-4 space-y-4">
        {isLoading.toString()}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <h1 className="text-xl font-semibold">Calls</h1>
          {selectedNumber && (
            <span className="text-sm text-muted-foreground" title="Selected number">
              {selectedNumber}
            </span>
          )}
          {error && (
            <span className="text-sm text-destructive" title={error}>
              {error}
            </span>
          )}
          {isLoading && (
            <span className="text-sm text-muted-foreground">Connecting…</span>
          )}
          <ConnectionStatus />
        </div>

        <ClientAutoConnect />
        <CallNotificationHandler />

        <div className="grid md:grid-cols-2 gap-4">
          <Dialer />
          <CallOptions />
        </div>
        <CallHistory />
      </section>
    </PageLayout>
  );
}

export default CallsPage;