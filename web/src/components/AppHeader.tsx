import type { ReactNode } from 'react';
import { Link, NavLink } from 'react-router-dom';

export function AppHeader({ children }: { children?: ReactNode }) {
  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    [
      'text-sm font-medium px-3 py-1 transition-colors border-b-2',
      isActive
        ? 'border-[var(--accent)]'
        : 'border-transparent hover:border-[var(--line)]',
    ].join(' ');

  const navLinkStyle = ({ isActive }: { isActive: boolean }) => ({
    color: isActive ? 'var(--ink)' : 'var(--ink-2)',
  });

  return (
    <header
      className="sticky top-0 z-20"
      style={{ background: 'var(--card)', borderBottom: '1px solid var(--line)' }}
    >
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 gap-4">

        {/* Brand mark + wordmark */}
        <Link to="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity shrink-0">
          <div
            className="w-10 h-10 flex items-center justify-center shrink-0"
            style={{ background: 'var(--accent)', borderRadius: 11 }}
          >
            <svg width="26" height="26" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* A peak stroke — cream */}
              <path d="M13 4 L3 20 M13 4 L23 20" stroke="#FBF5EC" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"/>
              {/* Crossbar */}
              <path d="M7 15 L19 15" stroke="#FBF5EC" strokeWidth="2.8" strokeLinecap="round"/>
              {/* Sun-yellow dot at base */}
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

        {/* Nav links */}
        <nav className="hidden sm:flex items-center gap-1">
          <NavLink to="/" end className={navLinkClass} style={navLinkStyle}>Dashboard</NavLink>
          <NavLink to="/job-boards" className={navLinkClass} style={navLinkStyle}>Job Boards</NavLink>
        </nav>

        {/* Right slot (UserMenu etc.) */}
        {children && (
          <div className="flex items-center gap-3">
            {children}
          </div>
        )}
      </div>
    </header>
  );
}
