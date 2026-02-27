import Link from 'next/link';

const highlights = [
  {
    title: 'Crystal-clear calling',
    description: 'Run WebRTC voice flows with low latency and reliable media routing.',
    icon: '📞',
  },
  {
    title: 'Live quality insights',
    description: 'Track jitter, packet loss, and call events to debug in seconds.',
    icon: '📊',
  },
  {
    title: 'AI-ready workflows',
    description: 'Plug in SIP.js, SDK, or AI agent mode with one unified interface.',
    icon: '🤖',
  },
];

export default function Home() {
  return (
    <main className="landing-shell">
      <section className="landing-hero">
        <p className="landing-eyebrow">Google Voice style · Telnyx powered</p>
        <h1>Beautiful calling dashboard for teams</h1>
        <p className="landing-subtitle">
          Manage calls, voicemail, and conversation quality from one clean workspace
          designed for support and sales teams.
        </p>

        <div className="landing-cta-row">
          <Link href="/sign-up" className="landing-btn landing-btn-primary">
            Get started free
          </Link>
          <Link href="/sign-in" className="landing-btn landing-btn-secondary">
            Sign in
          </Link>
        </div>

        <div className="landing-mockup" aria-label="Dashboard preview">
          <div className="landing-mockup-top">
            <span className="landing-dot" />
            <span className="landing-dot" />
            <span className="landing-dot" />
            <strong>Voice Dashboard</strong>
          </div>
          <div className="landing-mockup-grid">
            <div className="landing-stat-card">
              <p>Calls Today</p>
              <strong>128</strong>
            </div>
            <div className="landing-stat-card">
              <p>Answered</p>
              <strong>94%</strong>
            </div>
            <div className="landing-stat-card wide">
              <p>Average response</p>
              <strong>12 sec</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-highlights">
        {highlights.map((item) => (
          <article className="landing-feature" key={item.title}>
            <span>{item.icon}</span>
            <h2>{item.title}</h2>
            <p>{item.description}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
