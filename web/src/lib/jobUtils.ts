export function safeUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const { protocol } = new URL(url);
    return protocol === 'http:' || protocol === 'https:' ? url : null;
  } catch {
    return null;
  }
}

export function formatDate(d: string | null | undefined, empty = '—'): string {
  if (!d) return empty;
  const [year, month, day] = d.split('-');
  return `${month}/${day}/${year?.slice(2)}`;
}
