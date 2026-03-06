'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSelectedNumber } from '@/contexts/SelectedNumberContext';

const Sidebar = () => {
  const pathname = usePathname();
  const { numbers, selectedNumber, setSelectedNumber, loading } = useSelectedNumber();

  const isMessages = pathname === '/messages';
  const isCalls = pathname === '/calls';
  const isVoicemail = pathname === '/voicemail';

  const displayLabel = loading
    ? 'Loading…'
    : selectedNumber ?? (numbers.length === 0 ? 'No number' : 'Select number');

  return (
    <aside className="sidebar">
      <nav>
        <details className="number-group" open>
          <summary className="number-parent active">
            <span className="number-caret" aria-hidden>▸</span>
            <span aria-hidden>☎</span>
            {numbers.length > 1 ? (
              <select
                className="number-title number-select"
                value={selectedNumber ?? ''}
                onChange={(e) => setSelectedNumber(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                aria-label="Select phone number"
                title="Messages, Calls, and Voicemail below are for this number"
              >
                {numbers.map((n) => (
                  <option key={n.id} value={n.phone_number}>
                    {n.phone_number}
                  </option>
                ))}
              </select>
            ) : (
              <span className="number-title" title="Messages, Calls, and Voicemail below are for this number">
                {displayLabel}
              </span>
            )}
            {selectedNumber && numbers.length > 0 && (
              <span className="status-pill">Active</span>
            )}
          </summary>
          <div className="number-children">
            <Link className={`nav-item child-item ${isMessages ? 'active' : ''}`} href="/messages">
              <span aria-hidden>💬</span>
              <span className="nav-label">Messages</span>
            </Link>
            <Link className={`nav-item child-item ${isCalls ? 'active' : ''}`} href="/calls">
              <span aria-hidden>📞</span>
              <span className="nav-label">Calls</span>
            </Link>
            <Link className={`nav-item child-item ${isVoicemail ? 'active' : ''}`} href="/voicemail">
              <span aria-hidden>📼</span>
              <span className="nav-label">Voicemail</span>
            </Link>
          </div>
        </details>

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
