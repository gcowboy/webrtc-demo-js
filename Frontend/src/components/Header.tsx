'use client';

import { SignedIn, SignedOut, UserButton } from '@clerk/nextjs';
import Link from 'next/link';
import ConnectionStatus from './ConnectionStatus';
import SipJsConnectionStatus from './SipJsConnectionStatus';
import PreCallDiagnosisButton from './PreCallDiagnosisButton';
import CheckRegistrationButton from './CheckRegistrationButton';
import SDKVersionDropdown from './SDKVersionDropdown';
import RegionSelect from './RegionSelect';
import { useClientMode } from '@/atoms/clientMode';

const Header = () => {
  const [mode] = useClientMode();

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button type="button" className="icon-btn" aria-label="Main menu">
          ☰
        </button>
        <div className="brand">
          <span className="google-wordmark">Telnyx</span>
          <span className="voice-wordmark">WebRTC Demo</span>
        </div>
      </div>

      <div className="search-wrap">
        <span className="search-icon">🔍</span>
        <input type="text" placeholder="Search" aria-label="Search" />
      </div>

      <div className="topbar-right">
        <Link href="/settings" className="icon-btn" aria-label="Settings">
          ⚙
        </Link>
        {mode === 'sipjs' ? (
          <SipJsConnectionStatus />
        ) : mode === 'aiagent' ? null : (
          <ConnectionStatus />
        )}
        <SignedOut>
          <Link className="top-link" href="/sign-in">
            Sign in
          </Link>
          <Link className="top-link top-link-primary" href="/sign-up">
            Sign up
          </Link>
        </SignedOut>
        <SignedIn>
          <UserButton
            afterSignOutUrl="/"
            appearance={{
              elements: {
                avatarBox: '!h-9 !w-9 rounded-full bg-[var(--blue)] text-white font-semibold',
              },
            }}
          />
        </SignedIn>
      </div>
    </header>
  );
};

export default Header;
