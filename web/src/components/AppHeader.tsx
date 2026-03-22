import type { ReactNode } from 'react';
import { Link, NavLink } from 'react-router-dom';

export function AppHeader({ children }: { children?: ReactNode }) {
  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    [
      'text-sm font-medium px-3 py-1.5 rounded-md transition-colors',
      isActive
        ? 'bg-white/20 text-white'
        : 'text-accent-200 hover:bg-white/10 hover:text-white',
    ].join(' ');

  return (
    <header className="sticky top-0 z-20 shadow-lg bg-brand-800">
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 gap-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity shrink-0">
          <div className="w-10 h-10 rounded-lg bg-accent-400 flex items-center justify-center shrink-0">
            <span className="text-xl leading-none">🚀</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight leading-tight">
              LaunchPad
            </h1>
            <p className="hidden sm:block text-sm text-white/80 font-medium mt-0.5">
              your internship command center
            </p>
          </div>
        </Link>

        {/* Nav links */}
        <nav className="hidden sm:flex items-center gap-1">
          <NavLink to="/" end className={navLinkClass}>Dashboard</NavLink>
          <NavLink to="/job-boards" className={navLinkClass}>Job Boards</NavLink>
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
