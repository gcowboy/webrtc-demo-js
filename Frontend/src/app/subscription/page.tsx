import Link from 'next/link';

export default function SubscriptionPage() {
  return (
    <main className="settings-layout">
      <header className="settings-header">
        <h1>Subscription</h1>
        <Link className="panel-link" href="/">
          Back to Messages
        </Link>
      </header>

      <section className="settings-card">
        <h2>Current Plan</h2>
        <p className="auth-footer">WebRTC Demo Starter</p>
        <div className="setting-row">
          <span>Price</span>
          <strong>$10/month</strong>
        </div>
        <div className="setting-row">
          <span>Included users</span>
          <strong>1</strong>
        </div>
        <button className="send-btn" type="button">
          Upgrade Plan
        </button>
      </section>
    </main>
  );
}
