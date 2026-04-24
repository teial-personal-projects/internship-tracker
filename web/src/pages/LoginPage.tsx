import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { MIN_YEAR_OPTIONS } from '@shared/types';
import type { MinYear } from '@shared/types';

// ── Password strength ──────────────────────────────────────────────────────

function validatePassword(pwd: string): string | null {
  if (pwd.length < 8) return 'At least 8 characters';
  if (!/[A-Z]/.test(pwd)) return 'Needs an uppercase letter';
  if (!/[a-z]/.test(pwd)) return 'Needs a lowercase letter';
  if (!/[0-9]/.test(pwd)) return 'Needs a number';
  return null;
}

function getStrength(pwd: string): 'weak' | 'medium' | 'strong' | null {
  if (!pwd) return null;
  if (validatePassword(pwd)) return 'weak';
  if (/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) return 'strong';
  return 'medium';
}

const STRENGTH_COLOR = {
  weak: 'text-red-400',
  medium: 'text-orange-400',
  strong: 'text-green-500',
} as const;

const STRENGTH_BAR_COLOR = {
  weak: 'bg-red-400',
  medium: 'bg-orange-400',
  strong: 'bg-green-500',
} as const;

const STRENGTH_VALUE = { weak: 33, medium: 66, strong: 100 } as const;

// ── Login form ─────────────────────────────────────────────────────────────

function LoginForm({ onSwitch }: { onSwitch: () => void }) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await signIn(email, password);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="mb-6">
        <h2
          className="text-2xl font-bold text-[#1e3a5f]"
          style={{ fontFamily: "'Fraunces', serif" }}
        >
          Welcome back
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Sign in to continue tracking job applications
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base pointer-events-none">✉️</span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                disabled={loading}
                className="field-input pl-10"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Password
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base pointer-events-none">🔒</span>
              <input
                type={showPwd ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••"
                disabled={loading}
                className="field-input pl-10 pr-16"
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPwd((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-blue-600 font-medium hover:text-blue-700"
              >
                {showPwd ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <div className="pt-1">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gray-800 text-white font-semibold text-sm rounded-lg py-3 hover:bg-gray-900 disabled:opacity-60 transition-colors"
            >
              {loading ? 'Signing in…' : 'Sign In →'}
            </button>
          </div>
        </div>
      </form>

      <div className="mt-6 pt-5 border-t border-gray-100 text-center">
        <p className="text-sm text-gray-500">
          Don't have an account?{' '}
          <button
            type="button"
            onClick={onSwitch}
            className="text-blue-600 font-semibold hover:text-blue-700 transition-colors"
          >
            Sign up free
          </button>
        </p>
      </div>
    </>
  );
}

// ── Signup form ────────────────────────────────────────────────────────────

function SignupForm({ onSwitch }: { onSwitch: () => void }) {
  const { signUp } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [currentClass, setCurrentClass] = useState<MinYear | ''>('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const strength = getStrength(password);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const pwdErr = validatePassword(password);
    if (!firstName.trim() || !lastName.trim()) { setError('First and last name are required'); return; }
    if (pwdErr) { setError(pwdErr); return; }
    if (password !== confirm) { setError('Passwords do not match'); return; }
    setLoading(true);
    try {
      await signUp(email, password, firstName.trim(), lastName.trim(), currentClass || undefined);
      setMessage('Check your email to confirm your account.');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create account');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="mb-6">
        <h2
          className="text-2xl font-bold text-gray-900"
          style={{ fontFamily: "'Fraunces', serif" }}
        >
          Create account
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Start tracking your job applications
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
      {message && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-700">{message}</p>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="flex flex-col gap-4">
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                First Name
              </label>
              <input
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Jane"
                disabled={loading}
                className="field-input"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                Last Name
              </label>
              <input
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Smith"
                disabled={loading}
                className="field-input"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Current Class
            </label>
            <select
              value={currentClass}
              onChange={(e) => setCurrentClass(e.target.value as MinYear | '')}
              disabled={loading}
              className="field-input"
            >
              <option value="">— Select your year —</option>
              {MIN_YEAR_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>{opt.charAt(0).toUpperCase() + opt.slice(1)}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base pointer-events-none">✉️</span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                disabled={loading}
                className="field-input pl-10"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Password
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base pointer-events-none">🔒</span>
              <input
                type={showPwd ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••"
                disabled={loading}
                className="field-input pl-10 pr-16"
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPwd((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-blue-600 font-medium hover:text-blue-700"
              >
                {showPwd ? 'Hide' : 'Show'}
              </button>
            </div>
            {strength && (
              <div className="mt-2">
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${STRENGTH_BAR_COLOR[strength]}`}
                      style={{ width: `${STRENGTH_VALUE[strength]}%` }}
                    />
                  </div>
                  <span className={`text-xs font-medium ${STRENGTH_COLOR[strength]}`}>
                    {strength.charAt(0).toUpperCase() + strength.slice(1)}
                  </span>
                </div>
              </div>
            )}
            <p className="text-xs text-gray-400 mt-1">
              8+ characters with uppercase, lowercase, and numbers
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Confirm Password
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base pointer-events-none">🔒</span>
              <input
                type={showConfirm ? 'text' : 'password'}
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="••••••••••"
                disabled={loading}
                className="field-input pl-10 pr-16"
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowConfirm((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-blue-600 font-medium hover:text-blue-700"
              >
                {showConfirm ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <div className="pt-1">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gray-800 text-white font-semibold text-sm rounded-lg py-3 hover:bg-gray-900 disabled:opacity-60 transition-colors"
            >
              {loading ? 'Creating account…' : 'Create Account →'}
            </button>
          </div>
        </div>
      </form>

      <div className="mt-6 pt-5 border-t border-gray-100 text-center">
        <p className="text-sm text-gray-500">
          Already have an account?{' '}
          <button
            type="button"
            onClick={onSwitch}
            className="text-blue-600 font-semibold hover:text-blue-700 transition-colors"
          >
            Sign in
          </button>
        </p>
      </div>
    </>
  );
}

// ── Page shell ─────────────────────────────────────────────────────────────

export function LoginPage() {
  const [tab, setTab] = useState<'login' | 'signup'>('login');

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-10"
      style={{ background: 'linear-gradient(160deg, #3a7a5c 0%, #5a9e7e 40%, #d0e8dc 70%, #f0f7f3 100%)' }}
    >
      {/* Logo + tagline */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-12 h-12 rounded-xl bg-accent-400 flex items-center justify-center">
            <svg width="32" height="32" viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="18" y="40" width="60" height="38" rx="7" fill="#EAF3DE"/>
              <path d="M36 40 L36 33 Q36 26 43 26 L53 26 Q60 26 60 33 L60 40" stroke="#EAF3DE" stroke-width="4.5" fill="none" stroke-linecap="round"/>
              <rect x="18" y="53" width="60" height="5" fill="#1A3C2E" opacity="0.15"/>
              <rect x="43" y="50" width="10" height="8" rx="2.5" fill="#6B7FD4"/>
            </svg>
          </div>
          <span
            className="text-3xl font-bold text-white"
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
          >
            Track My App
          </span>
        </div>
        <p className="text-sm text-green-200">
          Track every application, never miss a deadline
        </p>
      </div>

      {/* Card */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          {(['login', 'signup'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={[
                'flex-1 py-4 text-sm font-semibold transition-colors',
                tab === t
                  ? 'text-gray-900 border-b-2 border-gray-800'
                  : 'text-gray-400 hover:text-gray-600',
              ].join(' ')}
            >
              {t === 'login' ? 'Sign In' : 'Sign Up'}
            </button>
          ))}
        </div>

        {/* Form body */}
        <div className="p-8">
          {tab === 'login'
            ? <LoginForm onSwitch={() => setTab('signup')} />
            : <SignupForm onSwitch={() => setTab('login')} />
          }
        </div>

        {/* Trust footer */}
        <div className="flex items-center justify-center gap-4 px-8 pb-6 text-xs text-gray-400">
          <span>🔒 Secure</span>
          <span>· Free to use ·</span>
          <span>💼 Career focused</span>
        </div>
      </div>
    </div>
  );
}
