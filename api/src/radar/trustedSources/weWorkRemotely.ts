import { detectRemoteStatus } from '../normalize';
import type { NormalizedPosting } from '../adapters/types';
import type { MatchCriteria } from '../match';
import { matches } from '../match';
import type { TrustedSourceAdapter, TrustedSourceDefinition } from './types';

type RssItem = {
  title: string;
  link: string;
  guid: string | null;
  pubDate: string | null;
};

function decodeXml(value: string): string {
  return value
    .replace(/<!\[CDATA\[(.*?)\]\]>/gs, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

function tagValue(itemXml: string, tagName: string): string | null {
  const match = itemXml.match(new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, 'i'));
  return match ? decodeXml(match[1]) : null;
}

function parseRssItems(xml: string): RssItem[] {
  return [...xml.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi)]
    .map((match) => {
      const itemXml = match[1];
      const title = tagValue(itemXml, 'title');
      const link = tagValue(itemXml, 'link');
      if (!title || !link) return null;

      return {
        title,
        link,
        guid: tagValue(itemXml, 'guid'),
        pubDate: tagValue(itemXml, 'pubDate'),
      };
    })
    .filter((item): item is RssItem => item !== null);
}

function parseWwrTitle(value: string): { companyName: string; title: string } {
  const [company, ...titleParts] = value.split(':');
  const title = titleParts.join(':').trim();
  return {
    companyName: title ? company.trim() : 'Unknown company',
    title: title || value.trim(),
  };
}

function postedAt(value: string | null): string | null {
  if (!value) return null;
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? null : new Date(timestamp).toISOString();
}

function reasonForTitle(title: string, criteria: MatchCriteria): string | null {
  const normalizedTitle = title.toLowerCase();
  const term = criteria.titleTerms.find((item) => normalizedTitle.includes(item));
  return term ? `title "${term}"` : null;
}

function withMatchReasons(posting: NormalizedPosting, sourceName: string, criteria: MatchCriteria): NormalizedPosting {
  const titleReason = reasonForTitle(posting.title, criteria);
  const locationReason = criteria.allowedRemoteStatuses.includes(posting.remoteStatus)
    ? `location ${posting.remoteStatus}`
    : null;

  return {
    ...posting,
    raw: {
      ...(posting.raw && typeof posting.raw === 'object' && !Array.isArray(posting.raw) ? posting.raw : {}),
      match_reasons: [titleReason, `source ${sourceName}`, locationReason].filter(Boolean),
    },
  };
}

export class WeWorkRemotelyAdapter implements TrustedSourceAdapter {
  async search(source: TrustedSourceDefinition, criteria: MatchCriteria): Promise<NormalizedPosting[]> {
    const postings: NormalizedPosting[] = [];

    for (const feedUrl of source.feedUrls) {
      const response = await fetch(feedUrl);
      if (!response.ok) {
        throw new Error(`We Work Remotely feed request failed with status ${response.status}`);
      }

      const xml = await response.text();
      const items = parseRssItems(xml);
      for (const item of items) {
        const parsedTitle = parseWwrTitle(item.title);
        const posting: NormalizedPosting = {
          externalId: item.guid ?? item.link,
          companyName: parsedTitle.companyName,
          title: parsedTitle.title,
          location: 'Remote',
          remoteStatus: detectRemoteStatus('Remote'),
          url: item.link,
          sourceName: source.name,
          sourceTier: source.tier,
          canonicalUrl: item.link,
          postedAt: postedAt(item.pubDate),
          raw: {
            ...item,
            feedUrl,
            attribution: source.attributionText ?? null,
          },
        };

        if (matches(posting, criteria)) {
          postings.push(withMatchReasons(posting, source.name, criteria));
        }
      }
    }

    return postings;
  }
}

export const weWorkRemotelyAdapter = new WeWorkRemotelyAdapter();
