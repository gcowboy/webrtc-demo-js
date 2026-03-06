'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { fetchNumbersApi } from '@/lib/api';

type TopUpInfo = {
  adminWallet: { network: string; address: string };
  suggestedAmounts: number[];
  balance?: number;
};

function TopUpContent() {
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [info, setInfo] = useState<TopUpInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState('');
  const [balance, setBalance] = useState<number | null>(null);

  const load = async () => {
    if (!getToken) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetchNumbersApi(getToken, 'top-up/admin-info');
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || 'Failed to load');
      setInfo(data);
      if (data.balance != null) setBalance(data.balance);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [getToken]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const hash = txHash.trim();
    if (!hash) {
      toast.error('Please enter the transaction hash');
      return;
    }
    if (!getToken) {
      toast.error('Please sign in to top up');
      return;
    }
    setVerifying(true);
    try {
      const res = await fetchNumbersApi(getToken, 'top-up/verify', {
        method: 'POST',
        body: JSON.stringify({ transactionId: hash }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || 'Verification failed');
      toast.success(data.message ?? 'Balance updated.');
      setBalance(data.balance);
      setTxHash('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setVerifying(false);
    }
  };

  const copyAddress = () => {
    if (!info?.adminWallet.address) return;
    navigator.clipboard.writeText(info.adminWallet.address);
    toast.success('Address copied');
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[hsl(var(--background))] px-4">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-[hsl(var(--primary))] border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading…</p>
        </div>
      </div>
    );
  }

  if (error && !info) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[hsl(var(--background))] px-4">
        <div className="w-full max-w-sm rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-8 text-center shadow-sm">
          <p className="text-[hsl(var(--foreground))] font-medium">Could not load</p>
          <p className="mt-2 text-sm text-muted-foreground">{error}</p>
          <Button className="mt-6" variant="outline" onClick={() => window.location.reload()}>
            Retry
          </Button>
          <Link href="/" className="mt-4 block text-sm text-[hsl(var(--primary))] hover:underline">
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  if (!info) return null;

  const displayBalance = balance ?? info.balance ?? 0;

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] px-4 py-10 sm:py-16">
      <div className="mx-auto max-w-md">
        <Link
          href="/"
          className="text-sm text-muted-foreground hover:text-[hsl(var(--foreground))]"
        >
          ← Back
        </Link>

        <div className="mt-8 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm overflow-hidden">
          {/* Balance */}
          <div className="border-b border-[hsl(var(--border))] bg-[hsl(var(--muted))]/50 px-6 py-8 text-center">
            <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
              Your balance
            </p>
            <p className="mt-2 text-4xl font-semibold tabular-nums text-[hsl(var(--foreground))]">
              {displayBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-lg font-normal text-muted-foreground">USDC</span>
            </p>
          </div>

          {/* Deposit */}
          <div className="px-6 py-6">
            <h2 className="text-lg font-semibold text-[hsl(var(--foreground))]">
              Deposit USDC
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Send USDC to the address below on the correct network, then paste the transaction hash to credit your balance.
            </p>

            <div className="mt-5 space-y-4">
              <div>
                <Label className="text-muted-foreground">Network</Label>
                <p className="mt-1 rounded-lg bg-[hsl(var(--muted))]/60 px-3 py-2 text-sm font-medium capitalize text-[hsl(var(--foreground))]">
                  {info.adminWallet.network}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">Wallet address</Label>
                <div className="mt-1 flex items-center gap-2">
                  <code className="flex-1 break-all rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/40 px-3 py-2.5 text-xs text-[hsl(var(--foreground))]">
                    {info.adminWallet.address}
                  </code>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="shrink-0"
                    onClick={copyAddress}
                  >
                    Copy
                  </Button>
                </div>
              </div>
              {info.suggestedAmounts.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  Suggested: {info.suggestedAmounts.map((a) => `${a} USDC`).join(', ')} — any amount is accepted.
                </p>
              )}
            </div>

            <form onSubmit={handleSubmit} className="mt-6">
              <Label htmlFor="tx">Transaction hash</Label>
              <Input
                id="tx"
                type="text"
                placeholder="0x…"
                value={txHash}
                onChange={(e) => setTxHash(e.target.value)}
                className="mt-1.5 font-mono text-sm"
              />
              <Button
                type="submit"
                className="mt-4 w-full"
                disabled={verifying}
              >
                {verifying ? 'Verifying…' : 'Credit balance'}
              </Button>
            </form>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Only USDC transfers to this address on {info.adminWallet.network} are credited. Each transaction can be used once.
        </p>
      </div>
    </div>
  );
}

export default function TopUpPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[hsl(var(--background))]">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-[hsl(var(--primary))] border-t-transparent" />
        </div>
      }
    >
      <TopUpContent />
    </Suspense>
  );
}
