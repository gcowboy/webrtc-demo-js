import Link from 'next/link';

export default function SettingsPage() {
  return (
    <main className="settings-layout">
      <header className="settings-header">
        <h1>Settings</h1>
        <Link className="panel-link" href="/">
          Back to Messages
        </Link>
      </header>

      <section className="settings-card">
        <h2>Active Number</h2>
        <p className="auth-footer">
          Choose which purchased number is active for outbound calls and SMS.
        </p>

        <form className="number-picker" aria-label="Select active purchased number">
          <label className="number-option active">
            <input type="radio" name="active-number" defaultChecked />
            <span className="number-text">+1 (415) 555-0101 — San Francisco</span>
            <span className="status-pill">Active</span>
          </label>
          <label className="number-option">
            <input type="radio" name="active-number" />
            <span className="number-text">+1 (650) 555-0123 — Palo Alto</span>
          </label>

          <div className="number-actions">
            <button className="send-btn" type="button">
              Set Active Number
            </button>
            <Link className="panel-link" href="/purchase-number">
              Purchase New Number
            </Link>
          </div>
        </form>
      </section>
    </main>
  );
}
