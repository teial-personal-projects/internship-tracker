import { useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar } from './Avatar';
import { Spinner } from './Spinner';
import { useClickOutside } from '@/hooks/useClickOutside';

export function UserMenu() {
  const { user, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const closeMenu = useCallback(() => setIsOpen(false), []);
  useClickOutside(ref, closeMenu);

  async function handleSignOut() {
    setLoading(true);
    try {
      await signOut();
    } catch (err) {
      console.error('Sign out error:', err);
    } finally {
      setLoading(false);
      setIsOpen(false);
    }
  }

  if (!user) return null;

  const firstName = user.user_metadata?.first_name as string | undefined;
  const lastName = user.user_metadata?.last_name as string | undefined;
  const displayName = firstName ? `${firstName}${lastName ? ` ${lastName}` : ''}` : (user.email ?? 'User');
  const avatarName = displayName;

  return (
    <div className="relative" ref={ref}>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="inline-flex items-center gap-2 px-2 py-1.5 rounded-md font-medium transition-colors focus:outline-none"
        style={{
          background: 'var(--card)',
          border: '1px solid var(--line)',
          color: 'var(--ink)',
        }}
      >
        <Avatar name={avatarName} size={32} />

        <span className="hidden sm:block max-w-[150px] overflow-hidden text-ellipsis whitespace-nowrap text-sm">
          {displayName}
        </span>

        {/* Chevron */}
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}
          aria-hidden="true"
        >
          <path d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          className="absolute right-0 z-20 mt-2 w-56 min-w-[224px] rounded-xl"
          style={{
            background: 'var(--card)',
            border: '1px solid var(--line)',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          {/* Signed in as */}
          <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--line)' }}>
            <p className="text-sm font-medium" style={{ color: 'var(--ink)' }}>Signed in as</p>
            <p className="text-sm mt-1 truncate" style={{ color: 'var(--ink-3)' }}>{user.email}</p>
          </div>

          {/* Nav links (visible on mobile where header nav is hidden) */}
          <div className="p-2 sm:hidden" style={{ borderBottom: '1px solid var(--line-soft)' }}>
            <Link
              to="/"
              onClick={() => setIsOpen(false)}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors hover:bg-[var(--softer)]"
              style={{ color: 'var(--ink-2)' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
              </svg>
              Dashboard
            </Link>
            <Link
              to="/job-boards"
              onClick={() => setIsOpen(false)}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors hover:bg-[var(--softer)]"
              style={{ color: 'var(--ink-2)' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
              </svg>
              Job Boards
            </Link>
          </div>

          {/* Profile */}
          <div className="p-2" style={{ borderBottom: '1px solid var(--line-soft)' }}>
            <Link
              to="/profile"
              onClick={() => setIsOpen(false)}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors hover:bg-[var(--softer)]"
              style={{ color: 'var(--ink-2)' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              Profile
            </Link>
          </div>

          {/* Sign out */}
          <div className="p-2">
            <button
              type="button"
              onClick={handleSignOut}
              disabled={loading}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors hover:bg-red-50 disabled:opacity-60"
              style={{ color: '#B5394A' }}
            >
              {loading ? (
                <>
                  <Spinner color="red" />
                  Signing out…
                </>
              ) : (
                <>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Sign Out
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
