const AVATAR_COLORS = {
  warm: { bg: '#F5E6C4', color: '#A36410', border: 'transparent' },
  neutral: { bg: 'transparent', color: 'var(--ink-3)', border: 'var(--line)' },
} as const;

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

interface AvatarProps {
  name: string;
  size?: number;
  variant?: keyof typeof AVATAR_COLORS;
}

export function Avatar({ name, size = 32, variant = 'warm' }: AvatarProps) {
  const colors = AVATAR_COLORS[variant];

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: variant === 'neutral' ? 999 : 12,
        background: colors.bg,
        border: `1px solid ${colors.border}`,
        color: colors.color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: Math.round(size * 0.375),
        fontWeight: 600,
        flexShrink: 0,
        letterSpacing: '0.02em',
        userSelect: 'none',
      }}
      aria-label={name}
    >
      {getInitials(name)}
    </div>
  );
}
