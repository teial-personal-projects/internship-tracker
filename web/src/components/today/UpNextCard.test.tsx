import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { TodayInterview } from '@shared/schemas';
import { UpNextCard } from './UpNextCard';

describe('UpNextCard', () => {
  it('shows application type for the interview application', () => {
    const interview = {
      id: 'interview-1',
      application_id: 'application-1',
      user_id: 'user-1',
      interview_type: 'phone_screen',
      status: 'scheduled',
      scheduled_at: '2026-06-19T18:00:00.000Z',
      interviewer_names: null,
      location_link: null,
      notes: null,
      application_company: 'Cold Co',
      application_title: 'Electrical Engineering Intern',
      application_type: 'cold_strategic',
    } as TodayInterview;

    const markup = renderToStaticMarkup(<UpNextCard interview={interview} />);

    expect(markup).toContain('Cold Co');
    expect(markup).toContain('Electrical Engineering Intern');
    expect(markup).toContain('Cold');
  });
});
