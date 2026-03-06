'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';
import Link from 'next/link';
import {
  fetchAdminApi,
  type AdminStats,
  type AdminUsersResponse,
  type AdminPhoneNumbersResponse,
  type AdminTransactionsResponse,
} from '@/lib/admin-api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

const PAGE_SIZE = 20;

export default function AdminPage() {
  const { getToken, isSignedIn } = useAuth();
  const [accessDenied, setAccessDenied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AdminStats | null>(null);

  const [users, setUsers] = useState<AdminUsersResponse | null>(null);
  const [usersSkip, setUsersSkip] = useState(0);
  const [usersSearch, setUsersSearch] = useState('');
  const [usersSearchDebounced, setUsersSearchDebounced] = useState('');
  const [usersLoading, setUsersLoading] = useState(false);

  const [phoneNumbers, setPhoneNumbers] = useState<AdminPhoneNumbersResponse | null>(null);
  const [phoneSkip, setPhoneSkip] = useState(0);
  const [phoneUserId, setPhoneUserId] = useState('');
  const [phoneLoading, setPhoneLoading] = useState(false);

  const [transactions, setTransactions] = useState<AdminTransactionsResponse | null>(null);
  const [txSkip, setTxSkip] = useState(0);
  const [txUserId, setTxUserId] = useState('');
  const [txStatus, setTxStatus] = useState('');
  const [txLoading, setTxLoading] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setUsersSearchDebounced(usersSearch), 300);
    return () => clearTimeout(t);
  }, [usersSearch]);
  useEffect(() => setUsersSkip(0), [usersSearchDebounced]);
  useEffect(() => setPhoneSkip(0), [phoneUserId]);
  useEffect(() => setTxSkip(0), [txUserId, txStatus]);

  const checkAccess = useCallback(async () => {
    if (!getToken || !isSignedIn) {
      setAccessDenied(true);
      setLoading(false);
      return;
    }
    try {
      const res = await fetchAdminApi(getToken, '/admin/stats');
      if (res.status === 403) {
        setAccessDenied(true);
        setStats(null);
      } else if (!res.ok) {
        throw new Error(res.statusText);
      } else {
        const data = await res.json();
        setStats(data);
        setAccessDenied(false);
      }
    } catch (e) {
      console.error('Admin access check failed', e);
      toast.error('Failed to load admin');
      setAccessDenied(true);
    } finally {
      setLoading(false);
    }
  }, [getToken, isSignedIn]);

  useEffect(() => {
    checkAccess();
  }, [checkAccess]);

  const loadUsers = useCallback(async () => {
    if (!getToken) return;
    setUsersLoading(true);
    try {
      const params = new URLSearchParams({
        skip: String(usersSkip),
        take: String(PAGE_SIZE),
      });
      if (usersSearchDebounced.trim()) params.set('search', usersSearchDebounced.trim());
      const res = await fetchAdminApi(getToken, `/admin/users?${params}`);
      if (!res.ok) throw new Error(res.statusText);
      const data = await res.json();
      setUsers(data);
    } catch (e) {
      console.error('Failed to load users', e);
      toast.error('Failed to load users');
      setUsers(null);
    } finally {
      setUsersLoading(false);
    }
  }, [getToken, usersSkip, usersSearchDebounced]);

  const loadPhoneNumbers = useCallback(async () => {
    if (!getToken) return;
    setPhoneLoading(true);
    try {
      const params = new URLSearchParams({
        skip: String(phoneSkip),
        take: String(PAGE_SIZE),
      });
      if (phoneUserId.trim()) params.set('userId', phoneUserId.trim());
      const res = await fetchAdminApi(getToken, `/admin/phone-numbers?${params}`);
      if (!res.ok) throw new Error(res.statusText);
      const data = await res.json();
      setPhoneNumbers(data);
    } catch (e) {
      console.error('Failed to load phone numbers', e);
      toast.error('Failed to load phone numbers');
      setPhoneNumbers(null);
    } finally {
      setPhoneLoading(false);
    }
  }, [getToken, phoneSkip, phoneUserId]);

  const loadTransactions = useCallback(async () => {
    if (!getToken) return;
    setTxLoading(true);
    try {
      const params = new URLSearchParams({
        skip: String(txSkip),
        take: String(PAGE_SIZE),
      });
      if (txUserId.trim()) params.set('userId', txUserId.trim());
      if (txStatus.trim()) params.set('status', txStatus.trim());
      const res = await fetchAdminApi(getToken, `/admin/transactions?${params}`);
      if (!res.ok) throw new Error(res.statusText);
      const data = await res.json();
      setTransactions(data);
    } catch (e) {
      console.error('Failed to load transactions', e);
      toast.error('Failed to load transactions');
      setTransactions(null);
    } finally {
      setTxLoading(false);
    }
  }, [getToken, txSkip, txUserId, txStatus]);

  useEffect(() => {
    if (accessDenied || !getToken) return;
    loadUsers();
  }, [loadUsers, accessDenied, getToken]);

  useEffect(() => {
    if (accessDenied || !getToken) return;
    loadPhoneNumbers();
  }, [loadPhoneNumbers, accessDenied, getToken]);

  useEffect(() => {
    if (accessDenied || !getToken) return;
    loadTransactions();
  }, [loadTransactions, accessDenied, getToken]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Checking access…</p>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground">You must be signed in to access admin.</p>
          <Link href="/sign-in" className="mt-2 inline-block text-[hsl(var(--primary))] hover:underline">
            Sign in
          </Link>
        </CardContent>
      </Card>
    );
  }

  if (accessDenied) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="font-medium text-[hsl(var(--destructive))]">Access denied.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Your account does not have admin access.
          </p>
          {appUrl ? (
            <a href={appUrl} className="mt-3 inline-block text-[hsl(var(--primary))] hover:underline">
              Back to app
            </a>
          ) : null}
        </CardContent>
      </Card>
    );
  }

  return (
    <Tabs defaultValue="stats" className="space-y-4">
      <TabsList className="grid w-full max-w-md grid-cols-4">
        <TabsTrigger value="stats">Stats</TabsTrigger>
        <TabsTrigger value="users">Users</TabsTrigger>
        <TabsTrigger value="phones">Phones</TabsTrigger>
        <TabsTrigger value="transactions">Transactions</TabsTrigger>
      </TabsList>

      <TabsContent value="stats" className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Users</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats?.users ?? 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Phone numbers</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats?.phoneNumbers ?? 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Top-up transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats?.topUpTransactions ?? 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total verified top-up</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {typeof stats?.totalTopUpVerified === 'number'
                  ? Number(stats.totalTopUpVerified).toFixed(2)
                  : String(stats?.totalTopUpVerified ?? 0)}
              </p>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="users" className="space-y-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>Users</CardTitle>
            <div className="flex items-center gap-2">
              <Input
                placeholder="Search by email, name, id…"
                value={usersSearch}
                onChange={(e) => setUsersSearch(e.target.value)}
                className="max-w-xs"
              />
              <Button variant="outline" size="sm" onClick={loadUsers} disabled={usersLoading}>
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {usersLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
            {!usersLoading && users && (
              <>
                <p className="mb-2 text-sm text-muted-foreground">Total: {users.total}</p>
                <div className="overflow-x-auto rounded-md border">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="p-2 font-medium">ID</th>
                        <th className="p-2 font-medium">Email</th>
                        <th className="p-2 font-medium">Name</th>
                        <th className="p-2 font-medium">Type</th>
                        <th className="p-2 font-medium">Balance</th>
                        <th className="p-2 font-medium">Numbers</th>
                        <th className="p-2 font-medium">Updated</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.data.map((u) => (
                        <tr key={u.id} className="border-t">
                          <td className="p-2 font-mono text-xs">{u.id.slice(0, 12)}…</td>
                          <td className="p-2">{u.email ?? '—'}</td>
                          <td className="p-2">{u.fullName ?? u.username ?? '—'}</td>
                          <td className="p-2">{u.accountType ?? '—'}</td>
                          <td className="p-2">{String(u.balance)}</td>
                          <td className="p-2">{u._count.phoneNumbers}</td>
                          <td className="p-2 text-muted-foreground">{new Date(u.updatedAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={usersSkip === 0 || usersLoading}
                    onClick={() => setUsersSkip((s) => Math.max(0, s - PAGE_SIZE))}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    {usersSkip + 1}–{usersSkip + users.data.length} of {users.total}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={usersSkip + PAGE_SIZE >= users.total || usersLoading}
                    onClick={() => setUsersSkip((s) => s + PAGE_SIZE)}
                  >
                    Next
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="phones" className="space-y-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>Phone numbers</CardTitle>
            <div className="flex items-center gap-2">
              <Input
                placeholder="Filter by user ID"
                value={phoneUserId}
                onChange={(e) => setPhoneUserId(e.target.value)}
                className="max-w-xs"
              />
              <Button variant="outline" size="sm" onClick={loadPhoneNumbers} disabled={phoneLoading}>
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {phoneLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
            {!phoneLoading && phoneNumbers && (
              <>
                <p className="mb-2 text-sm text-muted-foreground">Total: {phoneNumbers.total}</p>
                <div className="overflow-x-auto rounded-md border">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="p-2 font-medium">Number</th>
                        <th className="p-2 font-medium">Country</th>
                        <th className="p-2 font-medium">User</th>
                        <th className="p-2 font-medium">Monthly cost</th>
                        <th className="p-2 font-medium">Created</th>
                      </tr>
                    </thead>
                    <tbody>
                      {phoneNumbers.data.map((p) => (
                        <tr key={p.id} className="border-t">
                          <td className="p-2 font-mono">{p.phoneNumber}</td>
                          <td className="p-2">{p.countryCode || '—'}</td>
                          <td className="p-2">
                            {p.user?.fullName ?? p.user?.email ?? p.userId.slice(0, 8) + '…'}
                          </td>
                          <td className="p-2">{String(p.monthlyCost)}</td>
                          <td className="p-2 text-muted-foreground">{new Date(p.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={phoneSkip === 0 || phoneLoading}
                    onClick={() => setPhoneSkip((s) => Math.max(0, s - PAGE_SIZE))}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    {phoneSkip + 1}–{phoneSkip + phoneNumbers.data.length} of {phoneNumbers.total}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={phoneSkip + PAGE_SIZE >= phoneNumbers.total || phoneLoading}
                    onClick={() => setPhoneSkip((s) => s + PAGE_SIZE)}
                  >
                    Next
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="transactions" className="space-y-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>Top-up transactions</CardTitle>
            <div className="flex items-center gap-2">
              <Input
                placeholder="User ID"
                value={txUserId}
                onChange={(e) => setTxUserId(e.target.value)}
                className="max-w-[140px]"
              />
              <Input
                placeholder="Status"
                value={txStatus}
                onChange={(e) => setTxStatus(e.target.value)}
                className="max-w-[100px]"
              />
              <Button variant="outline" size="sm" onClick={loadTransactions} disabled={txLoading}>
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {txLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
            {!txLoading && transactions && (
              <>
                <p className="mb-2 text-sm text-muted-foreground">Total: {transactions.total}</p>
                <div className="overflow-x-auto rounded-md border">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="p-2 font-medium">Tx hash</th>
                        <th className="p-2 font-medium">User</th>
                        <th className="p-2 font-medium">Amount</th>
                        <th className="p-2 font-medium">Status</th>
                        <th className="p-2 font-medium">Created</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.data.map((t) => (
                        <tr key={t.id} className="border-t">
                          <td className="p-2 font-mono text-xs">{t.txHash.slice(0, 10)}…</td>
                          <td className="p-2">{t.user?.email ?? t.userId.slice(0, 8) + '…'}</td>
                          <td className="p-2">{String(t.amount)}</td>
                          <td className="p-2">{t.status}</td>
                          <td className="p-2 text-muted-foreground">{new Date(t.createdAt).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={txSkip === 0 || txLoading}
                    onClick={() => setTxSkip((s) => Math.max(0, s - PAGE_SIZE))}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    {txSkip + 1}–{txSkip + transactions.data.length} of {transactions.total}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={txSkip + PAGE_SIZE >= transactions.total || txLoading}
                    onClick={() => setTxSkip((s) => s + PAGE_SIZE)}
                  >
                    Next
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
