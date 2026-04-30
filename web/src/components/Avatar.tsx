const AVATAR_COLOR = { bg: '#F5E6C4', color: '#A36410' };

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
}

export function Avatar({ name, size = 32 }: AvatarProps) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 12,
        background: AVATAR_COLOR.bg,
        color: AVATAR_COLOR.color,
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
