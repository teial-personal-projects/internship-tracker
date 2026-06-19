import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { Interview } from '@shared/schemas';
import { ApplicationInterviewLog } from './ApplicationInterviewLog';

const interview: Interview = {
  id: '11111111-1111-4111-8111-111111111111',
  user_id: '22222222-2222-4222-8222-222222222222',
  application_id: '33333333-3333-4333-8333-333333333333',
  interview_type: 'screening',
  scheduled_at: '2026-06-20T17:30:00.000Z',
  interviewer_names: 'Jordan Lee',
  location_link: null,
  notes: 'Review portfolio notes before the call.',
  status: 'completed',
  outcome: 'passed',
  created_at: '2026-06-18T12:00:00.000Z',
  updated_at: '2026-06-20T18:00:00.000Z',
};

describe('ApplicationInterviewLog', () => {
  it('renders an empty interview history state', () => {
    const markup = renderToStaticMarkup(
      <ApplicationInterviewLog interviews={[]} isLoading={false} isError={false} />,
    );

    expect(markup).toContain('Interview History');
    expect(markup).toContain('No interviews logged for this application.');
  });

  it('renders interview history details', () => {
    const markup = renderToStaticMarkup(
      <ApplicationInterviewLog
        interviews={[
          interview,
          { ...interview, id: '44444444-4444-4444-8444-444444444444', interview_type: 'system_design' },
          { ...interview, id: '55555555-5555-4555-8555-555555555555', interview_type: 'technical' },
        ]}
        isLoading={false}
        isError={false}
      />,
    );

    expect(markup).toContain('Screening');
    expect(markup).toContain('System Design');
    expect(markup).toContain('Technical');
    expect(markup).toContain('Completed');
    expect(markup).toContain('With Jordan Lee');
    expect(markup).toContain('Outcome: Passed');
    expect(markup).toContain('Review portfolio notes before the call.');
  });

  it('renders loading and error states', () => {
    expect(renderToStaticMarkup(
      <ApplicationInterviewLog interviews={[]} isLoading isError={false} />,
    )).toContain('Loading interviews');

    expect(renderToStaticMarkup(
      <ApplicationInterviewLog interviews={[]} isLoading={false} isError />,
    )).toContain('Failed to load interviews.');
  });
});
