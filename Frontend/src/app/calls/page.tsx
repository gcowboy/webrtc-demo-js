'use client';

import PageLayout from '@/components/PageLayout';

export default function CallsPage() {
  return (
    <PageLayout>
      <section className="panel inbox-panel">
        <div className="panel-header">
          <h1>Calls</h1>
          <button className="panel-link" type="button">
            Clear missed
          </button>
        </div>

        <div className="thread-list">
          <article className="thread selected unread">
            <div className="thread-main">
              <h2>+1 (415) 555-0133</h2>
              <p>Missed incoming call</p>
            </div>
            <div className="thread-meta">
              <time>9:12 AM</time>
              <span className="badge">1</span>
            </div>
          </article>
          <article className="thread">
            <div className="thread-main">
              <h2>+1 (206) 555-0188</h2>
              <p>Outgoing call • 12m 42s</p>
            </div>
            <div className="thread-meta">
              <time>Yesterday</time>
              <span className="status-check">✓ Completed</span>
            </div>
          </article>
        </div>
      </section>
    </PageLayout>
  );
}
