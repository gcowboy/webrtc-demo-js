'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSelectedNumber } from '@/contexts/SelectedNumberContext';

const STORAGE_KEY = 'sidebar-expanded-ids';

function readExpandedIds(): Record<string, boolean> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, boolean>;
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

function writeExpandedIds(value: Record<string, boolean>) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    // ignore
  }
}

const Sidebar = () => {
  const pathname = usePathname();
  const { numbers, selectedNumber, setSelectedNumber, loading } = useSelectedNumber();
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>(readExpandedIds);

  useEffect(() => {
    writeExpandedIds(expandedIds);
  }, [expandedIds]);

  const toggleExpanded = useCallback((id: string) => {
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const isMessages = pathname === '/messages';
  const isCalls = pathname === '/calls';
  const isVoicemail = pathname === '/voicemail';

  return (
    <aside className="sidebar">
      <nav>
        {loading ? (
          <div className="number-group">
            <div className="number-parent">
              <span className="number-caret" aria-hidden>▸</span>
              <span className="number-icon" aria-hidden>☎</span>
              <span className="number-title">Loading…</span>
            </div>
          </div>
        ) : numbers.length === 0 ? (
          <div className="number-group">
            <div className="number-parent">
              <span className="number-caret" aria-hidden>▸</span>
              <span className="number-icon" aria-hidden>☎</span>
              <span className="number-title">No number</span>
            </div>
          </div>
        ) : (
          numbers.map((n) => {
            const isSelected = selectedNumber === n.phone_number;
            const isOpen = expandedIds[n.id] ?? false;
            return (
              <details
                key={n.id}
                className="number-group"
                open={isOpen}
                onClick={(e) => {
                  const target = e.target as HTMLElement;
                  if (target.closest('a')) return;
                  setSelectedNumber(n.phone_number);
                }}
              >
                <summary
                  className={`number-parent ${isSelected ? 'active' : ''}`}
                  title={n.profile_name?.trim() ? `${n.profile_name.trim()} (${n.phone_number})` : n.phone_number}
                  onClick={(e) => {
                    e.preventDefault();
                    toggleExpanded(n.id);
                    setSelectedNumber(n.phone_number);
                  }}
                >
                  <span className="number-caret" aria-hidden>▸</span>
                  <span className="number-icon" aria-hidden>☎</span>
                  <span className="number-title">
                    {n.profile_name?.trim()
                      ? `${n.profile_name.trim()}(${n.phone_number})`
                      : n.phone_number}
                  </span>
                  <span className="status-pill">Active</span>
                </summary>
                <div className="number-children">
                  <Link
                    className={`nav-item child-item ${isMessages && isSelected ? 'active' : ''}`}
                    href="/messages"
                    onClick={() => {
                      console.log('messages', n.phone_number);
                    }}
                  >
                    <span aria-hidden>💬</span>
                    <span className="nav-label">Messages</span>
                  </Link>
                  <Link
                    className={`nav-item child-item ${isCalls && isSelected ? 'active' : ''}`}
                    href="/calls"
                    onClick={() => setSelectedNumber(n.phone_number)}
                  >
                    <span aria-hidden>📞</span>
                    <span className="nav-label">Calls</span>
                  </Link>
                  <Link
                    className={`nav-item child-item ${isVoicemail && isSelected ? 'active' : ''}`}
                    href="/voicemail"
                    onClick={() => setSelectedNumber(n.phone_number)}
                  >
                    <span aria-hidden>📼</span>
                    <span className="nav-label">Voicemail</span>
                  </Link>
                </div>
              </details>
            );
          })
        )}

        <Link className="nav-item" href="/">
          <span aria-hidden>📨</span>
          <span className="nav-label">Spam</span>
        </Link>
        <Link className={`nav-item ${pathname === '/purchase-number' ? 'active' : ''}`} href="/purchase-number">
          <span aria-hidden>➕</span>
          <span className="nav-label">Buy Number</span>
        </Link>
        <Link className="nav-item" href="/">
          <span aria-hidden>🗑</span>
          <span className="nav-label">Trash</span>
        </Link>
      </nav>
    </aside>
  );
};

export default Sidebar;
