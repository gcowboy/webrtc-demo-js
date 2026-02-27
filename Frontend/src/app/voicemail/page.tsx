'use client';

import PageLayout from '@/components/PageLayout';

export default function VoicemailPage() {
  return (
    <PageLayout>
      <section className="panel inbox-panel">
        <div className="panel-header">
          <h1>Voicemail</h1>
          <button className="panel-link" type="button">
            Mark all as heard
          </button>
        </div>

        <div className="thread-list">
          <article className="thread selected unread">
            <div className="thread-main">
              <h2>+1 (628) 555-0109</h2>
              <p>"Hi, calling about the project update..."</p>
            </div>
            <div className="thread-meta">
              <time>8:27 AM</time>
              <span className="badge">1</span>
            </div>
          </article>
          <article className="thread">
            <div className="thread-main">
              <h2>+1 (650) 555-0123</h2>
              <p>"Can you call me back this afternoon?"</p>
            </div>
            <div className="thread-meta">
              <time>Mon</time>
              <span className="status-check">✓ Heard</span>
            </div>
          </article>
        </div>
      </section>
    </PageLayout>
  );
}
