import { NavLink } from 'react-router-dom';
import { Briefcase, Users, Calendar, ClipboardList } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface TabConfig {
  to: string;
  label: string;
  mobileLabel: string;
  Icon: LucideIcon;
}

const TABS: TabConfig[] = [
  { to: '/applications', label: 'Applications', mobileLabel: 'Apps',      Icon: Briefcase     },
  { to: '/contacts',     label: 'Contacts',      mobileLabel: 'Contacts',  Icon: Users         },
  { to: '/interviews',   label: 'Interviews',    mobileLabel: 'Interviews', Icon: Calendar      },
  { to: '/action-items', label: 'Action Items',  mobileLabel: 'Actions',   Icon: ClipboardList },
];

export function NavBar() {
  return (
    <>
      {/* Desktop tab bar — horizontal, sits below the header */}
      <div
        className="hidden md:block border-b"
        style={{ background: 'var(--card)', borderColor: 'var(--line)' }}
      >
        <nav
          className="flex overflow-x-auto px-4 sm:px-6"
          style={{ scrollbarWidth: 'none' }}
          aria-label="Primary navigation"
        >
          {TABS.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                [
                  'shrink-0 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
                  isActive ? 'border-(--accent)' : 'border-transparent hover:border-(--line)',
                ].join(' ')
              }
              style={({ isActive }) => ({
                color: isActive ? 'var(--ink)' : 'var(--ink-3)',
              })}
            >
              {label}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Mobile bottom bar — fixed, icon + label */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-30 flex"
        style={{
          background: 'var(--card)',
          borderTop: '1px solid var(--line)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
        aria-label="Primary navigation"
      >
        {TABS.map(({ to, label, mobileLabel, Icon }) => (
          <NavLink
            key={to}
            to={to}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2 min-h-13 transition-colors"
            style={({ isActive }) => ({
              color: isActive ? 'var(--accent)' : 'var(--ink-3)',
            })}
            aria-label={label}
          >
            {({ isActive }) => (
              <>
                <Icon
                  size={22}
                  strokeWidth={isActive ? 2.5 : 1.75}
                  fill={isActive ? 'var(--accent-tint)' : 'none'}
                />
                <span className="text-[10px] font-semibold tracking-wide">
                  {mobileLabel}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </>
  );
}
