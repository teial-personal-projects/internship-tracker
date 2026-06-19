import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import type { Application } from '@shared/schemas';
import {
  APPLICATION_KANBAN_STATUSES,
  ApplicationsKanbanBoard,
  groupApplicationsByStatus,
} from './ApplicationsKanbanBoard';

function makeApplication(overrides: Partial<Application> = {}): Application {
  return {
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
    updated_at: '2026-02-03T12:00:00.000Z',
    ...overrides,
  };
}

describe('ApplicationsKanbanBoard', () => {
  it('groups applications into every supported status column', () => {
    const grouped = groupApplicationsByStatus([
      makeApplication({ id: '11111111-1111-4111-8111-111111111111', status: 'applied' }),
      makeApplication({ id: '33333333-3333-4333-8333-333333333333', status: 'technical' }),
    ]);

    expect(Object.keys(grouped)).toEqual(APPLICATION_KANBAN_STATUSES);
    expect(grouped.applied).toHaveLength(1);
    expect(grouped.technical).toHaveLength(1);
    expect(grouped.not_started).toEqual([]);
    expect(grouped.archive).toEqual([]);
  });

  it('renders all lanes with visible counts and muted empty lanes', () => {
    const markup = renderToStaticMarkup(
      <ApplicationsKanbanBoard
        applications={[makeApplication()]}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        deletingId={null}
      />,
    );

    expect(markup).toContain('Not Started');
    expect(markup).toContain('In Progress');
    expect(markup).toContain('Applied');
    expect(markup).toContain('Screening');
    expect(markup).toContain('Interviewing');
    expect(markup).toContain('Technical');
    expect(markup).toContain('On Site');
    expect(markup).toContain('Final Round');
    expect(markup).toContain('Offered');
    expect(markup).toContain('Rejected');
    expect(markup).toContain('Withdrawn');
    expect(markup).toContain('Archive');
    expect(markup).toContain('No applications');
  });

  it('renders required card fields and actions from the filtered result set', () => {
    const markup = renderToStaticMarkup(
      <ApplicationsKanbanBoard
        applications={[makeApplication({ applied_date: null })]}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        deletingId={null}
      />,
    );

    expect(markup).toContain('Acme Robotics');
    expect(markup).toContain('Controls Engineering Intern');
    expect(markup).toContain('Not applied');
    expect(markup).toContain('02/01/2026');
    expect(markup).toContain('Pasadena, CA');
    expect(markup).toContain('Referral');
    expect(markup).toContain('Edit');
    expect(markup).toContain('aria-label="Delete"');
  });
});
