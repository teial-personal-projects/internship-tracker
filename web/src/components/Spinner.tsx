interface Props {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'brand' | 'red' | 'white' | 'gray';
}

const sizeClasses: Record<NonNullable<Props['size']>, string> = {
  sm: 'w-3 h-3 border-2',
  md: 'w-4 h-4 border-2',
  lg: 'w-8 h-8 border-2',
  xl: 'w-10 h-10 border-2',
};

const colorClasses: Record<NonNullable<Props['color']>, string> = {
  brand: 'border-brand-500 border-t-transparent',
  red:   'border-red-400 border-t-transparent',
  white: 'border-white/40 border-t-white',
  gray:  'border-gray-400 border-t-transparent',
};

export function Spinner({ size = 'md', color = 'brand' }: Props) {
  return (
    <span
      className={`inline-block rounded-full animate-spin ${sizeClasses[size]} ${colorClasses[color]}`}
    />
  );
}
