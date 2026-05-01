import { Link } from 'react-router-dom';
import { NavBar } from './NavBar';
import { HamburgerMenu } from './HamburgerMenu';

export function AppHeader() {
  return (
    <header
      className="sticky top-0 z-20"
      style={{ background: 'var(--card)', borderBottom: '1px solid var(--line)' }}
    >
      {/* Top bar — brand + hamburger */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 gap-4">

        {/* Brand mark + wordmark */}
        <Link to="/applications" className="flex items-center gap-3 hover:opacity-90 transition-opacity shrink-0">
          <div
            className="w-10 h-10 flex items-center justify-center shrink-0"
            style={{ background: 'var(--accent)', borderRadius: 11 }}
          >
            <svg width="26" height="26" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M13 4 L3 20 M13 4 L23 20" stroke="#FBF5EC" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M7 15 L19 15" stroke="#FBF5EC" strokeWidth="2.8" strokeLinecap="round"/>
              <circle cx="13" cy="21.5" r="2" fill="#D9A441"/>
            </svg>
          </div>
          <div>
            <h1
              className="text-base font-bold tracking-tight leading-tight flex items-center gap-2"
              style={{ color: 'var(--ink)' }}
            >
              Track My Application
              <span
                className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
                style={{ background: 'var(--soft)', color: 'var(--ink-2)' }}
              >
                v{import.meta.env.VITE_APP_VERSION}
              </span>
            </h1>
            <p
              className="hidden sm:block text-xs font-medium mt-0.5"
              style={{ color: 'var(--ink-3)' }}
            >
              Manage your job applications
            </p>
          </div>
        </Link>

        {/* Hamburger menu */}
        <HamburgerMenu />
      </div>

      {/* Tab bar */}
      <NavBar />
    </header>
  );
}
