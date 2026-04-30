const COLOR_SLOTS = [
  { bg: '#DDE8DF', color: '#6B8F7A' },
  { bg: '#F7D9CD', color: '#A8442A' },
  { bg: '#F5E6C4', color: '#A36410' },
  { bg: '#E0DAF0', color: '#7C6CB0' },
  { bg: '#F3E9D7', color: '#4E5775' },
] as const;

function hashName(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash += name.charCodeAt(i);
  }
  return hash % COLOR_SLOTS.length;
}

function getInitials(name: string): string {
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
  const slot = COLOR_SLOTS[hashName(name)];

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 12,
        background: slot.bg,
        color: slot.color,
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
