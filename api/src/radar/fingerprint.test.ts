import { describe, expect, it } from 'vitest';
import {
  createPostingFingerprint,
  normalizeCompanyForFingerprint,
  normalizeTitleForFingerprint,
  normalizeUrlHostForFingerprint,
} from './fingerprint';

describe('radar posting fingerprint', () => {
  it('normalizes title, company, and host noise', () => {
    expect(normalizeTitleForFingerprint('Senior Software Engineer - Platform (III)')).toBe('software engineer platform');
    expect(normalizeCompanyForFingerprint('Acme, Inc.')).toBe('acme');
    expect(normalizeUrlHostForFingerprint('https://www.greenhouse.io/jobs/1?utm_source=test')).toBe('greenhouse.io');
  });

  it('matches the same canonical role from ATS and aggregator URLs', () => {
    const canonicalUrl = 'https://boards.greenhouse.io/acme/jobs/123?utm_source=linkedin';

    expect(createPostingFingerprint('Acme', {
      externalId: '123',
      title: 'Senior Software Engineer',
      url: 'https://boards.greenhouse.io/acme/jobs/123',
      canonicalUrl,
      companyDomain: 'acme.com',
    })).toBe(createPostingFingerprint('Acme, Inc.', {
      externalId: 'linkedin-999',
      title: 'Software Engineer',
      url: 'https://linkedin.com/jobs/view/999',
      canonicalUrl,
      companyDomain: 'https://www.acme.com/careers',
    }));
  });
});
