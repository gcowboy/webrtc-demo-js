import Link from 'next/link';

export default function PurchaseNumberPage() {
  return (
    <main className="settings-layout">
      <header className="settings-header">
        <h1>Purchase Phone Number</h1>
        <Link className="panel-link" href="/settings">
          Back to Settings
        </Link>
      </header>

      <section className="settings-card">
        <h2>Search available numbers</h2>
        <div className="setting-row">
          <span>Area code</span>
          <strong>415</strong>
        </div>
        <div className="available-list">
          <article className="available-item">
            <div>
              <h3>+1 (415) 555-0196</h3>
              <p>San Francisco, CA • Local</p>
            </div>
            <button className="send-btn" type="button">
              Purchase
            </button>
          </article>
        </div>
      </section>
    </main>
  );
}
