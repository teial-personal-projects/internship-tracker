import type { AtsAdapter, NormalizedPosting } from './types';
import { normalizePosting, toAbsoluteUrl } from './helpers';

interface HtmlJobLink {
  href: string;
  title: string;
}

function stripTags(input: string): string {
  return input.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function decodeHtml(input: string): string {
  return input
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function extractJobLinks(html: string): HtmlJobLink[] {
  const links: HtmlJobLink[] = [];
  const anchorPattern = /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match: RegExpExecArray | null;

  while ((match = anchorPattern.exec(html)) !== null) {
    const href = decodeHtml(match[1]);
    const title = decodeHtml(stripTags(match[2]));
    const lowerHref = href.toLowerCase();
    const lowerTitle = title.toLowerCase();
    const looksLikeJob = lowerHref.includes('job') || lowerHref.includes('career') || lowerTitle.includes('engineer');

    if (title && looksLikeJob) {
      links.push({ href, title });
    }
  }

  return links;
}

export class HtmlFallbackAdapter implements AtsAdapter {
  constructor(private readonly defaultUrl?: string) {}

  async fetch(boardToken: string): Promise<NormalizedPosting[]> {
    const pageUrl = boardToken.startsWith('http') ? boardToken : this.defaultUrl ?? boardToken;
    const response = await fetch(pageUrl);
    if (!response.ok) {
      throw new Error(`HTML fallback request failed with status ${response.status}`);
    }

    const html = await response.text();
    return extractJobLinks(html).map((link) => {
      const url = toAbsoluteUrl(link.href, pageUrl);
      return normalizePosting({
        externalId: url,
        title: link.title,
        location: null,
        url,
        postedAt: null,
        raw: link,
      });
    });
  }
}

export class PinpointAdapter extends HtmlFallbackAdapter {}

export class WelcomeKitAdapter extends HtmlFallbackAdapter {}

export class CustomSiteAdapter extends HtmlFallbackAdapter {
  constructor() {
    super('https://careers.varsitytutors.com/');
  }
}

export const pinpointAdapter = new PinpointAdapter();
export const welcomeKitAdapter = new WelcomeKitAdapter();
export const customSiteAdapter = new CustomSiteAdapter();
