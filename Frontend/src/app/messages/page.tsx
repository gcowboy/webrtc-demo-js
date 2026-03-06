'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@clerk/nextjs';
import PageLayout from '@/components/PageLayout';
import { Button } from '@/components/ui/button';
import {
  FormControlField,
  FormControlSelect,
  FormControlInput,
  FormRow,
  FormStack,
} from '@/components/form';
import { useSelectedNumber } from '@/contexts/SelectedNumberContext';
import { fetchNumbersApi } from '@/lib/api';
import { toast } from 'sonner';

export type MessageItem = {
  id: string;
  from: string;
  to: string;
  text: string;
  direction: 'inbound' | 'outbound';
  createdAt: string;
};

type MyNumberItem = { phone_number: string; id: string };

export default function MessagesPage() {
  const { getToken } = useAuth();
  const { numbers: contextNumbers, selectedNumber } = useSelectedNumber();
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [myNumbers, setMyNumbers] = useState<MyNumberItem[]>([]);
  const [fromNumber, setFromNumber] = useState('');
  const [to, setTo] = useState('');
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  // Default "from" to the sidebar-selected number; keep in sync when selected number changes
  useEffect(() => {
    if (selectedNumber) {
      setFromNumber(selectedNumber);
    }
  }, [selectedNumber]);

  const loadMessages = useCallback(async () => {
    if (!getToken) return;
    try {
      const res = await fetchNumbersApi(getToken, '/messages');
      if (!res.ok) throw new Error(res.statusText);
      const data = await res.json();
      setMessages(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Failed to load messages', e);
      toast.error('Failed to load messages');
      setMessages([]);
    }
  }, [getToken]);

  const loadMyNumbers = useCallback(async () => {
    if (!getToken) return;
    try {
      const res = await fetchNumbersApi(getToken, '/numbers/mine');
      if (!res.ok) throw new Error(res.statusText);
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      const items = list.map((n: { phone_number?: string; id?: string }) => ({
        phone_number: n.phone_number ?? '',
        id: n.id ?? '',
      }));
      setMyNumbers(items);
      if (items.length && !fromNumber && !selectedNumber) {
        setFromNumber(items[0].phone_number);
      }
    } catch (e) {
      console.error('Failed to load numbers', e);
      toast.error('Failed to load your numbers');
      setMyNumbers([]);
    }
  }, [getToken, fromNumber, selectedNumber]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([loadMessages(), loadMyNumbers()]);
    setLoading(false);
  }, [loadMessages, loadMyNumbers]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  useEffect(() => {
    const interval = setInterval(loadMessages, 15000);
    return () => clearInterval(interval);
  }, [loadMessages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!getToken || !fromNumber.trim() || !to.trim() || !text.trim()) {
      toast.error('From, To, and Message are required');
      return;
    }
    setSending(true);
    try {
      const res = await fetchNumbersApi(getToken, '/messages/send', {
        method: 'POST',
        body: JSON.stringify({
          fromNumber: fromNumber.trim(),
          to: to.trim(),
          text: text.trim(),
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.message || res.statusText);
      }
      toast.success('Message sent');
      setText('');
      await loadMessages();
    } catch (e) {
      console.error('Send failed', e);
      toast.error(e instanceof Error ? e.message : 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const formatTime = (iso: string) => {
    try {
      const d = new Date(iso);
      const now = new Date();
      const sameDay = d.toDateString() === now.toDateString();
      return sameDay ? d.toLocaleTimeString() : d.toLocaleString();
    } catch {
      return iso;
    }
  };

  // Show only messages for the selected phone number (sidebar scope)
  const scopedMessages = useMemo(() => {
    if (!selectedNumber) return messages;
    return messages.filter(
      (msg) => msg.from === selectedNumber || msg.to === selectedNumber,
    );
  }, [messages, selectedNumber]);

  return (
    <PageLayout>
      <section className="settings-layout" style={{ maxWidth: '56rem', margin: '0 auto' }}>
        <header className="settings-header" style={{ flexDirection: 'row', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <h1>Messages</h1>
          <Button type="button" variant="outline" size="sm" onClick={loadAll} disabled={loading}>
            {loading ? 'Loading…' : 'Refresh'}
          </Button>
        </header>

        <section className="settings-card" style={{ marginBottom: '1.5rem' }}>
          <h2>Send SMS</h2>
          <form onSubmit={handleSend}>
            <FormStack>
              <FormRow>
                <FormControlField label="From (your number)" htmlFor="msg-from">
                  <FormControlSelect
                    id="msg-from"
                    value={fromNumber}
                    onChange={(e) => setFromNumber(e.target.value)}
                    disabled={loading}
                    aria-label="Select your number"
                    placeholder={myNumbers.length ? 'Select number' : 'No numbers'}
                    options={myNumbers.map((n) => ({
                      value: n.phone_number,
                      label: n.phone_number,
                    }))}
                  />
                </FormControlField>
                <FormControlField label="To (recipient E.164)" htmlFor="msg-to">
                  <FormControlInput
                    id="msg-to"
                    type="tel"
                    placeholder="+1234567890"
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                    aria-label="Recipient number"
                  />
                </FormControlField>
              </FormRow>
              <FormControlField label="Message" htmlFor="msg-text">
                <textarea
                  id="msg-text"
                  className="form-control"
                  rows={3}
                  placeholder="Type your message…"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  aria-label="Message text"
                  style={{ width: '100%', resize: 'vertical', minHeight: '4rem' }}
                />
              </FormControlField>
              <Button type="submit" disabled={sending || !fromNumber || !to.trim() || !text.trim()}>
                {sending ? 'Sending…' : 'Send'}
              </Button>
            </FormStack>
          </form>
        </section>

        <section className="settings-card">
          <h2>Message history{selectedNumber ? ` for ${selectedNumber}` : ''}</h2>
          {loading && scopedMessages.length === 0 ? (
            <p className="auth-footer">Loading messages…</p>
          ) : scopedMessages.length === 0 ? (
            <p className="auth-footer">
              {selectedNumber
                ? 'No messages for this number yet. Send one above or wait for inbound SMS.'
                : 'Select a phone number in the sidebar, or no messages yet.'}
            </p>
          ) : (
            <ul className="dashboard-list" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {scopedMessages.map((msg) => (
                <li
                  key={msg.id}
                  className="dashboard-list-item"
                  style={{
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    gap: '0.25rem',
                    padding: '0.75rem',
                    borderBottom: '1px solid var(--border-color, #e5e7eb)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <span style={{ fontWeight: 600 }}>
                      {msg.direction === 'inbound' ? (
                        <>From {msg.from}</>
                      ) : (
                        <>To {msg.to}</>
                      )}
                    </span>
                    <span style={{ fontSize: '0.875rem', color: 'var(--muted, #6b7280)' }}>
                      {formatTime(msg.createdAt)}
                    </span>
                  </div>
                  <p style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{msg.text}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </section>
    </PageLayout>
  );
}