import { createHash } from 'node:crypto';

export interface FingerprintPostingInput {
  externalId: string;
  title: string;
  url: string;
  canonicalUrl?: string | null;
  companyDomain?: string | null;
}

function compactWhitespace(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

export function normalizeTitleForFingerprint(title: string): string {
  return compactWhitespace(
    title
      .toLowerCase()
      .replace(/[()[\]{}.,;:|/\\_-]+/g, ' ')
      .replace(/\b(sr|snr|senior|jr|junior|ii|iii|iv|2|3|4)\b/g, ' '),
  );
}

export function normalizeCompanyForFingerprint(companyName: string): string {
  return compactWhitespace(
    companyName
      .toLowerCase()
      .replace(/&/g, ' and ')
      .replace(/[^a-z0-9]+/g, ' ')
      .replace(/\b(inc|incorporated|llc|ltd|corp|corporation|co|company)\b/g, ' '),
  );
}

export function normalizeUrlHostForFingerprint(value: string | null | undefined): string | null {
  if (!value) return null;

  const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value}`;

  try {
    const host = new URL(withProtocol).hostname.toLowerCase();
    return host.replace(/^www\./, '');
  } catch {
    return null;
  }
}

function normalizeUrlForFingerprint(value: string | null | undefined): string | null {
  if (!value) return null;

  try {
    const url = new URL(value);
    url.hash = '';
    for (const param of [...url.searchParams.keys()]) {
      if (/^(utm_|gh_src|lever-source|source|ref)/i.test(param)) {
        url.searchParams.delete(param);
      }
    }
    url.hostname = url.hostname.toLowerCase().replace(/^www\./, '');
    return url.toString().replace(/\/$/, '');
  } catch {
    return null;
  }
}

export function createPostingFingerprint(
  companyName: string,
  posting: FingerprintPostingInput,
): string {
  const company = normalizeCompanyForFingerprint(companyName);
  const title = normalizeTitleForFingerprint(posting.title);
  const host = normalizeUrlHostForFingerprint(posting.companyDomain)
    ?? normalizeUrlHostForFingerprint(posting.canonicalUrl)
    ?? normalizeUrlHostForFingerprint(posting.url)
    ?? 'unknown-host';
  const identity = normalizeUrlForFingerprint(posting.canonicalUrl)
    ?? posting.externalId
    ?? normalizeUrlForFingerprint(posting.url);

  return createHash('sha256')
    .update([company, title, host, identity].join('|'))
    .digest('hex');
}
