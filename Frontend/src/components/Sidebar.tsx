'use client';

import Link from 'next/link';

const Sidebar = () => {
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
            <Link className="nav-item child-item active" href="/">
              <span>💬</span>
              <span className="nav-label">Messages</span>
            </Link>
            <Link className="nav-item child-item" href="/">
              <span>📞</span>
              <span className="nav-label">Calls</span>
            </Link>
            <Link className="nav-item child-item" href="/">
              <span>📼</span>
              <span className="nav-label">Voicemail</span>
            </Link>
          </div>
        </details>
        <Link className="nav-item" href="/">
          <span>📨</span>
          <span className="nav-label">Spam</span>
        </Link>
        <Link className="nav-item" href="/">
          <span>⭐</span>
          <span className="nav-label">Subscription</span>
        </Link>
        <Link className="nav-item" href="/">
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
