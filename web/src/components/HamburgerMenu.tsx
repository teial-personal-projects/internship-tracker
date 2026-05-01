import { useState, useRef, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, BookOpen, Bell, User, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useClickOutside } from '@/hooks/useClickOutside';
import { Spinner } from './Spinner';

const MENU_ITEMS = [
  { to: '/playbook',      label: 'Playbook',       Icon: BookOpen },
  { to: '/notifications', label: 'Notifications',  Icon: Bell     },
] as const;

export function HamburgerMenu() {
  const { user, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const closeMenu = useCallback(() => setIsOpen(false), []);
  useClickOutside(menuRef, closeMenu);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') closeMenu();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [closeMenu]);

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await signOut();
    } finally {
      setSigningOut(false);
      closeMenu();
    }
  }

  return (
    <div ref={menuRef} className="relative">

      {/* Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(v => !v)}
        aria-expanded={isOpen}
        aria-label={isOpen ? 'Close menu' : 'Open menu'}
        className="flex items-center justify-center w-9 h-9 rounded-lg transition-colors"
        style={{ color: 'var(--ink-2)' }}
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 md:hidden"
          style={{ background: 'rgba(0,0,0,0.2)' }}
          onClick={closeMenu}
          aria-hidden="true"
        />
      )}

      {/* Panel — fixed drawer on mobile, dropdown on desktop */}
      <div
        className={[
          'fixed top-0 right-0 h-full w-72 z-50 flex flex-col transition-transform duration-200',
          'md:absolute md:top-full md:right-0 md:h-auto md:w-56 md:mt-2 md:rounded-xl md:transition-none',
          isOpen ? 'translate-x-0' : 'translate-x-full md:hidden',
        ].join(' ')}
        style={{
          background: 'var(--card)',
          borderLeft: '1px solid var(--line)',
          boxShadow: 'var(--shadow-md)',
        }}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
      >
        {/* User info */}
        <div
          className="px-4 py-4 shrink-0"
          style={{ borderBottom: '1px solid var(--line)' }}
        >
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--ink-3)' }}>
            Signed in as
          </p>
          <p className="text-sm font-medium mt-0.5 truncate" style={{ color: 'var(--ink)' }}>
            {user?.email}
          </p>
        </div>

        {/* Nav items */}
        <nav className="p-2 grow" style={{ borderBottom: '1px solid var(--line)' }}>
          {MENU_ITEMS.map(({ to, label, Icon }) => (
            <Link
              key={to}
              to={to}
              onClick={closeMenu}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors hover:bg-(--softer)"
              style={{ color: 'var(--ink-2)' }}
            >
              <Icon size={17} strokeWidth={1.75} />
              {label}
            </Link>
          ))}
        </nav>

        {/* Profile + Sign out */}
        <div className="p-2 shrink-0">
          <Link
            to="/profile"
            onClick={closeMenu}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors hover:bg-(--softer)"
            style={{ color: 'var(--ink-2)' }}
          >
            <User size={17} strokeWidth={1.75} />
            Profile
          </Link>
          <button
            type="button"
            onClick={handleSignOut}
            disabled={signingOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors hover:bg-red-50 disabled:opacity-60"
            style={{ color: '#B5394A' }}
          >
            {signingOut ? <Spinner color="red" /> : <LogOut size={17} strokeWidth={1.75} />}
            {signingOut ? 'Signing out…' : 'Sign Out'}
          </button>
        </div>
      </div>
    </div>
  );
}
