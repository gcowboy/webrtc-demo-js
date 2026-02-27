'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const Sidebar = () => {
  const pathname = usePathname();

  const isMessages = pathname === '/';
  const isCalls = pathname === '/calls';
  const isVoicemail = pathname === '/voicemail';

  return (
    <aside className="sidebar">
      <button type="button" className="primary-btn">
        + New call
      </button>
      <nav>
        <details className="number-group" open>
          <summary className="number-parent active">
            <span className="number-caret">▸</span>
            <span>☎</span>
            <span className="number-title">WebRTC Demo</span>
            <span className="status-pill">Active</span>
          </summary>
          <div className="number-children">
            <Link className={`nav-item child-item ${isMessages ? 'active' : ''}`} href="/">
              <span>💬</span>
              <span className="nav-label">Messages</span>
              <span className="badge" aria-label="3 unread messages">3</span>
            </Link>
            <Link className={`nav-item child-item ${isCalls ? 'active' : ''}`} href="/calls">
              <span>📞</span>
              <span className="nav-label">Calls</span>
              <span className="badge" aria-label="2 missed calls">2</span>
            </Link>
            <Link className={`nav-item child-item ${isVoicemail ? 'active' : ''}`} href="/voicemail">
              <span>📼</span>
              <span className="nav-label">Voicemail</span>
              <span className="badge" aria-label="1 unread voicemail">1</span>
            </Link>
          </div>
        </details>

        <Link className="nav-item" href="/">
          <span>📨</span>
          <span className="nav-label">Spam</span>
        </Link>
        <Link className={`nav-item ${pathname === '/subscription' ? 'active' : ''}`} href="/subscription">
          <span>⭐</span>
          <span className="nav-label">Subscription</span>
        </Link>
        <Link className={`nav-item ${pathname === '/purchase-number' ? 'active' : ''}`} href="/purchase-number">
          <span>➕</span>
          <span className="nav-label">Buy Number</span>
        </Link>
        <Link className="nav-item" href="/">
          <span>🗑</span>
          <span className="nav-label">Trash</span>
        </Link>
      </nav>
    </aside>
  );
};

export default Sidebar;
