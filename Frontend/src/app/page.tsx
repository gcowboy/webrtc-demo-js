import Link from 'next/link';
/**
 * import nextDynamic from 'next/dynamic';
 */
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

 






// 'use client';

// import PageLayout from '@/components/PageLayout';

// const kpiCards = [
//   { label: 'Today calls', value: '24', trend: '+18% from yesterday' },
//   { label: 'Avg response', value: '11s', trend: 'Fastest in 2 weeks' },
//   { label: 'Messages pending', value: '7', trend: '2 need urgent replies' },
//   { label: 'Voicemails', value: '3', trend: '1 marked important' },
// ];

// const reminders = [
//   {
//     name: 'Product demo with Acme Inc.',
//     time: '10:30 AM · Google Meet + Dial-in',
//     note: 'Share updated pricing deck and recording link.',
//   },
//   {
//     name: 'Recruiting call: Frontend Engineer',
//     time: '1:00 PM · Direct line',
//     note: 'Ask about WebRTC troubleshooting experience.',
//   },
//   {
//     name: 'Support sync: East region queue',
//     time: '4:45 PM · Team room',
//     note: 'Review missed calls and callback SLA.',
//   },
// ];

// export default function Home() {
//   return (
//     <PageLayout>
//       <section className="dashboard-grid">
//         <article className="dashboard-hero panel">
//           <div className="dashboard-hero-content">
//             <p className="dashboard-eyebrow">Smart calling dashboard</p>
//             <h1>Good morning, Sarah 👋</h1>
//             <p>
//               Keep every conversation organized with AI summaries, quick actions,
//               and beautiful call analytics inspired by Google Voice.
//             </p>
//             <div className="dashboard-hero-actions">
//               <button type="button" className="send-btn">
//                 Start new call
//               </button>
//               <button type="button" className="panel-link dashboard-ghost-btn">
//                 View campaign report
//               </button>
//             </div>
//           </div>
//         </article>

//         <article className="panel dashboard-kpis" aria-label="Performance metrics">
//           {kpiCards.map((card) => (
//             <div key={card.label} className="dashboard-kpi-card">
//               <p>{card.label}</p>
//               <strong>{card.value}</strong>
//               <span>{card.trend}</span>
//             </div>
//           ))}
//         </article>

//         <article className="panel dashboard-reminders">
//           <div className="panel-header">
//             <h2>Today&apos;s timeline</h2>
//             <button type="button" className="panel-link">
//               Open calendar
//             </button>
//           </div>
//           <div className="dashboard-list">
//             {reminders.map((reminder) => (
//               <div key={reminder.name} className="dashboard-list-item">
//                 <div className="dashboard-dot" aria-hidden="true" />
//                 <div>
//                   <h3>{reminder.name}</h3>
//                   <p>{reminder.time}</p>
//                   <small>{reminder.note}</small>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </article>

//         <article className="panel dashboard-banner">
//           <div>
//             <p className="dashboard-eyebrow">Team productivity</p>
//             <h2>Call quality is up 23% this week</h2>
//             <p>
//               Noise suppression and call routing are reducing dropped calls across
//               your busiest phone numbers.
//             </p>
//           </div>
//         </article>
//       </section>
//     </PageLayout>
//   );
// }
