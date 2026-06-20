import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { Application } from '@shared/schemas';
import { NeedAttentionPanel } from './NeedAttentionPanel';

const application: Application = {
  id: '11111111-1111-4111-8111-111111111111',
  user_id: '22222222-2222-4222-8222-222222222222',
  company: 'Acme Robotics',
  title: 'Controls Engineering Intern',
  industry: null,
  location: 'Pasadena, CA',
  job_link: null,
  app_link: null,
  status: 'applied',
  application_type: 'referral',
  checklist_state: {},
  source: 'manual',
  source_metadata: {},
  cover_letter: null,
  notes: null,
  pay: null,
  added: '2026-02-01',
  applied_date: '2026-02-03',
  deadline: null,
  created_at: '2026-02-01T12:00:00.000Z',
  updated_at: '2026-02-04T12:00:00.000Z',
};

describe('NeedAttentionPanel', () => {
  it('renders active applications as cards with applied date', () => {
    const markup = renderToStaticMarkup(<NeedAttentionPanel applications={[application]} />);

    expect(markup).toContain('Applications');
    expect(markup).toContain('Acme Robotics');
    expect(markup).toContain('Controls Engineering Intern');
    expect(markup).toContain('Applied');
    expect(markup).toContain('02/03/2026');
    expect(markup).toContain('grid gap-3');
  });
});
