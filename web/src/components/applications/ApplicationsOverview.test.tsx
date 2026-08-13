import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { ApplicationsOverview } from './ApplicationsOverview';

describe('ApplicationsOverview', () => {
  it('shows the application total and every relevant pipeline status', () => {
    const markup = renderToStaticMarkup(
      <ApplicationsOverview
        statusCounts={{
          not_started: 4,
          in_progress: 3,
          applied: 5,
          interviewing: 2,
          offered: 1,
          rejected: 2,
          archive: 1,
        }}
        activeStatus="interviewing"
        isLoading={false}
        onStatusSelect={vi.fn()}
      />,
    );

    expect(markup).toContain('Overview');
    expect(markup).toContain('Total Applications');
    expect(markup).toContain('>18<');
    expect(markup).toContain('Not Started');
    expect(markup).toContain('In Progress');
    expect(markup).toContain('Applied');
    expect(markup).toContain('Interviewing');
    expect(markup).toContain('Offered');
    expect(markup).toContain('Rejected');
    expect(markup).toContain('Archive');
    expect(markup).toContain('aria-pressed="true"');
  });
});
