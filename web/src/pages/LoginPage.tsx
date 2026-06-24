import { useState, type FormEvent, type ReactNode } from 'react';
import {
  ArrowRight,
  AtSign,
  BriefcaseBusiness,
  CalendarCheck2,
  CheckCircle2,
  Eye,
  EyeOff,
  GraduationCap,
  Lock,
  User,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { MIN_YEAR_OPTIONS } from '@shared/types';
import type { MinYear } from '@shared/types';

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

const STRENGTH_LABEL = {
  weak: 'Weak',
  medium: 'Good',
  strong: 'Strong',
} as const;

const STRENGTH_COLOR = {
  weak: 'var(--rose)',
  medium: 'var(--sun)',
  strong: 'var(--sage)',
} as const;

const STRENGTH_VALUE = { weak: 33, medium: 66, strong: 100 } as const;

function BrandMark() {
  return (
    <div
      className="flex h-11 w-11 shrink-0 items-center justify-center"
      style={{ background: 'var(--accent)', borderRadius: 11 }}
    >
      <svg width="27" height="27" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M13 4 L3 20 M13 4 L23 20" stroke="#FBF5EC" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M7 15 L19 15" stroke="#FBF5EC" strokeWidth="2.8" strokeLinecap="round" />
        <circle cx="13" cy="21.5" r="2" fill="#D9A441" />
      </svg>
    </div>
  );
}

function Alert({ tone, children }: { tone: 'error' | 'success'; children: ReactNode }) {
  const color = tone === 'error' ? 'var(--rose)' : 'var(--sage)';
  const background = tone === 'error' ? '#FDF1F3' : 'var(--sage-tint)';
  const border = tone === 'error' ? 'var(--rose-soft)' : 'var(--sage-soft)';

  return (
    <div className="mb-4 rounded-md border px-3 py-2 text-sm" style={{ background, borderColor: border, color }}>
      {children}
    </div>
  );
}

function TextInput({
  label,
  icon,
  right,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  icon?: ReactNode;
  right?: ReactNode;
}) {
  return (
    <label className="block">
      <span className="field-label">{label}</span>
      <span className="relative block min-w-0">
        {icon && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--ink-3)' }}>
            {icon}
          </span>
        )}
        <input
          {...props}
          className={`field-input min-w-0 ${icon ? 'pl-9' : ''} ${right ? 'pr-14' : ''} ${props.className ?? ''}`}
        />
        {right}
      </span>
    </label>
  );
}

function PasswordToggle({ visible, onToggle }: { visible: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      tabIndex={-1}
      onClick={onToggle}
      className="absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md transition-colors hover:bg-[color:var(--softer)]"
      style={{ color: 'var(--ink-3)' }}
      aria-label={visible ? 'Hide password' : 'Show password'}
    >
      {visible ? <EyeOff size={16} /> : <Eye size={16} />}
    </button>
  );
}

function AuthSubmitButton({ loading, children }: { loading: boolean; children: ReactNode }) {
  return (
    <button type="submit" disabled={loading} className="btn-primary min-h-11 w-full gap-2">
      {children}
      {!loading && <ArrowRight size={16} />}
    </button>
  );
}

function LoginForm({ onSwitch }: { onSwitch: () => void }) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
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
        <p className="text-kicker" style={{ color: 'var(--accent)' }}>Welcome back</p>
        <h2 className="mt-2 text-2xl font-bold tracking-tight" style={{ color: 'var(--ink)' }}>
          Sign in to your workspace
        </h2>
        <p className="mt-1 text-sm" style={{ color: 'var(--ink-2)' }}>
          Continue from your active applications, companies, and follow-ups.
        </p>
      </div>

      {error && <Alert tone="error">{error}</Alert>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <TextInput
          label="Email address"
          icon={<AtSign size={16} />}
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          disabled={loading}
        />

        <TextInput
          label="Password"
          icon={<Lock size={16} />}
          right={<PasswordToggle visible={showPwd} onToggle={() => setShowPwd((v) => !v)} />}
          type={showPwd ? 'text' : 'password'}
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password"
          disabled={loading}
        />

        <AuthSubmitButton loading={loading}>
          {loading ? 'Signing in...' : 'Sign in'}
        </AuthSubmitButton>
      </form>

      <div className="mt-6 border-t pt-5 text-center" style={{ borderColor: 'var(--line-soft)' }}>
        <p className="text-sm" style={{ color: 'var(--ink-2)' }}>
          New here?{' '}
          <button type="button" onClick={onSwitch} className="font-semibold hover:underline" style={{ color: 'var(--accent)' }}>
            Create an account
          </button>
        </p>
      </div>
    </>
  );
}

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

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
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
        <p className="text-kicker" style={{ color: 'var(--accent)' }}>Get organized</p>
        <h2 className="mt-2 text-2xl font-bold tracking-tight" style={{ color: 'var(--ink)' }}>
          Create your workspace
        </h2>
        <p className="mt-1 text-sm" style={{ color: 'var(--ink-2)' }}>
          Set up a focused place for applications, companies, and follow-ups.
        </p>
      </div>

      {error && <Alert tone="error">{error}</Alert>}
      {message && <Alert tone="success">{message}</Alert>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <TextInput
            label="First name"
            icon={<User size={16} />}
            required
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="Jane"
            disabled={loading}
          />
          <TextInput
            label="Last name"
            icon={<User size={16} />}
            required
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Smith"
            disabled={loading}
          />
        </div>

        <label className="block">
          <span className="field-label">Current class</span>
          <span className="relative block min-w-0">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--ink-3)' }}>
              <GraduationCap size={16} />
            </span>
            <select
              value={currentClass}
              onChange={(e) => setCurrentClass(e.target.value as MinYear | '')}
              disabled={loading}
              className="field-select min-w-0 pl-9"
            >
              <option value="">Select your year</option>
              {MIN_YEAR_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>{opt.charAt(0).toUpperCase() + opt.slice(1)}</option>
              ))}
            </select>
          </span>
        </label>

        <TextInput
          label="Email address"
          icon={<AtSign size={16} />}
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          disabled={loading}
        />

        <div>
          <TextInput
            label="Password"
            icon={<Lock size={16} />}
            right={<PasswordToggle visible={showPwd} onToggle={() => setShowPwd((v) => !v)} />}
            type={showPwd ? 'text' : 'password'}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Create a password"
            disabled={loading}
          />
          {strength && (
            <div className="mt-2 flex items-center gap-2">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full" style={{ background: 'var(--line-soft)' }}>
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${STRENGTH_VALUE[strength]}%`, background: STRENGTH_COLOR[strength] }}
                />
              </div>
              <span className="text-xs font-semibold" style={{ color: STRENGTH_COLOR[strength] }}>
                {STRENGTH_LABEL[strength]}
              </span>
            </div>
          )}
          <p className="mt-1 text-xs" style={{ color: 'var(--ink-3)' }}>
            Use 8+ characters with uppercase, lowercase, and numbers.
          </p>
        </div>

        <TextInput
          label="Confirm password"
          icon={<Lock size={16} />}
          right={<PasswordToggle visible={showConfirm} onToggle={() => setShowConfirm((v) => !v)} />}
          type={showConfirm ? 'text' : 'password'}
          required
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="Repeat your password"
          disabled={loading}
        />

        <AuthSubmitButton loading={loading}>
          {loading ? 'Creating account...' : 'Create account'}
        </AuthSubmitButton>
      </form>

      <div className="mt-6 border-t pt-5 text-center" style={{ borderColor: 'var(--line-soft)' }}>
        <p className="text-sm" style={{ color: 'var(--ink-2)' }}>
          Already have an account?{' '}
          <button type="button" onClick={onSwitch} className="font-semibold hover:underline" style={{ color: 'var(--accent)' }}>
            Sign in
          </button>
        </p>
      </div>
    </>
  );
}

function AuthFeature({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <div className="flex gap-3">
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
        style={{ background: 'var(--accent-tint)', color: 'var(--accent)' }}
      >
        {icon}
      </div>
      <div>
        <h3 className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>{title}</h3>
        <p className="mt-0.5 text-sm" style={{ color: 'var(--ink-2)' }}>{text}</p>
      </div>
    </div>
  );
}

function AuthBenefits() {
  return (
    <div className="border-t px-5 py-5 sm:px-7" style={{ borderColor: 'var(--line-soft)', background: 'var(--soft)' }}>
      <h2 className="text-sm font-bold" style={{ color: 'var(--ink)' }}>
        Why use Track My Application?
      </h2>
      <div className="mt-4 space-y-4">
        <AuthFeature
          icon={<CalendarCheck2 size={18} />}
          title="Know what needs attention"
          text="See upcoming interviews, follow-ups, and stale applications before they slip."
        />
        <AuthFeature
          icon={<BriefcaseBusiness size={18} />}
          title="Separate leads from applications"
          text="Use Companies To Watch without cluttering your active application list."
        />
        <AuthFeature
          icon={<CheckCircle2 size={18} />}
          title="Keep the workflow tight"
          text="Track the company, contacts, and next steps only when something is worth pursuing."
        />
      </div>
    </div>
  );
}

export function LoginPage() {
  const [tab, setTab] = useState<'login' | 'signup'>('login');

  return (
    <div className="min-h-screen overflow-x-hidden px-4 py-6 sm:px-6 lg:px-8" style={{ background: 'var(--bg)', maxWidth: '100vw' }}>
      <main className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-[34rem] items-center">
        <section className="w-full min-w-0">
          <div className="w-full max-w-full overflow-hidden rounded-lg border bg-white shadow-sm" style={{ borderColor: 'var(--line)' }}>
            <div className="flex items-center gap-3 border-b px-5 py-5 sm:px-7" style={{ borderColor: 'var(--line)', background: 'var(--soft)' }}>
              <BrandMark />
              <div className="min-w-0">
                <p className="text-kicker" style={{ color: 'var(--accent)' }}>Track My Application</p>
                <h1 className="mt-1 truncate text-lg font-bold" style={{ color: 'var(--ink)' }}>
                  Application workspace
                </h1>
              </div>
            </div>

            <div className="grid grid-cols-2 border-b" style={{ borderColor: 'var(--line)' }}>
              {(['login', 'signup'] as const).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setTab(item)}
                  className="min-h-12 min-w-0 truncate px-2 text-sm font-semibold transition-colors"
                  style={{
                    background: tab === item ? 'var(--card)' : 'var(--softer)',
                    color: tab === item ? 'var(--ink)' : 'var(--ink-3)',
                    boxShadow: tab === item ? 'inset 0 -2px 0 var(--accent)' : 'none',
                  }}
                >
                  {item === 'login' ? 'Sign in' : 'Create account'}
                </button>
              ))}
            </div>

            <div className="p-5 sm:p-7">
              {tab === 'login'
                ? <LoginForm onSwitch={() => setTab('signup')} />
                : <SignupForm onSwitch={() => setTab('login')} />
              }
            </div>

            <AuthBenefits />
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs" style={{ color: 'var(--ink-3)' }}>
            <span>Secure auth</span>
            <span aria-hidden="true">/</span>
            <span>Free to use</span>
            <span aria-hidden="true">/</span>
            <span>Career focused</span>
          </div>
        </section>
      </main>
    </div>
  );
}
