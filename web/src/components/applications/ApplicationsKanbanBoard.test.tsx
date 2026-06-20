import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import type { Application } from '@shared/schemas';
import {
  APPLICATION_KANBAN_STATUSES,
  ApplicationsKanbanBoard,
  KANBAN_COLLAPSED_CARD_LIMIT,
  getKanbanStatusMove,
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
      makeApplication({ id: '33333333-3333-4333-8333-333333333333', status: 'interviewing' }),
      makeApplication({ id: '44444444-4444-4444-8444-444444444444', status: 'interviewing' }),
      makeApplication({ id: '55555555-5555-4555-8555-555555555555', status: 'interviewing' }),
      makeApplication({ id: '66666666-6666-4666-8666-666666666666', status: 'rejected' }),
      makeApplication({ id: '77777777-7777-4777-8777-777777777777', status: 'archive' }),
    ]);

    expect(Object.keys(grouped)).toEqual(APPLICATION_KANBAN_STATUSES);
    expect(grouped.applied).toHaveLength(1);
    expect(grouped.interviewing).toHaveLength(3);
    expect(grouped.rejected).toHaveLength(2);
    expect(grouped.not_started).toEqual([]);
  });

  it('renders all lanes with visible counts and muted empty lanes', () => {
    const markup = renderToStaticMarkup(
      <ApplicationsKanbanBoard
        applications={[makeApplication()]}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onStatusChange={vi.fn()}
        deletingId={null}
      />,
    );

    expect(markup).toContain('Not Started');
    expect(markup).toContain('In Progress');
    expect(markup).toContain('Applied');
    expect(markup).toContain('Interviewing');
    expect(markup).toContain('Offered');
    expect(markup).toContain('Rejected');
    expect(markup).toContain('Offered');
    expect(markup).toContain('Rejected');
    expect(markup).not.toContain('Withdrawn');
    expect(markup).not.toContain('Archive');
    expect(markup).toContain('No applications');
  });

  it('renders required card fields and actions from the filtered result set', () => {
    const markup = renderToStaticMarkup(
      <ApplicationsKanbanBoard
        applications={[makeApplication({ applied_date: null })]}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onStatusChange={vi.fn()}
        deletingId={null}
      />,
    );

    expect(markup).toContain('Acme Robotics');
    expect(markup).toContain('Controls Engineering Intern');
    expect(markup).toContain('Not applied');
    expect(markup).toContain('02/01/2026');
    expect(markup).toContain('Pasadena, CA');
    expect(markup).toContain('Edit');
    expect(markup).toContain('aria-label="Delete"');
  });

  it('keeps Kanban lanes horizontally scrollable without page-level overflow', () => {
    const markup = renderToStaticMarkup(
      <ApplicationsKanbanBoard
        applications={[makeApplication()]}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onStatusChange={vi.fn()}
        deletingId={null}
      />,
    );

    expect(markup).toContain('w-full max-w-full min-w-0 overflow-x-auto overflow-y-hidden');
    expect(markup).toContain('w-[min(18rem,calc(100vw-2rem))] shrink-0');
    expect(markup).toContain('sm:w-72');
    expect(markup).toContain('w-full min-w-0 cursor-grab touch-none overflow-hidden');
  });

  it('resolves status moves and treats current-status drops as no-ops', () => {
    const app = makeApplication({ status: 'applied' });
    const interviewingApp = makeApplication({ status: 'interviewing' });

    expect(getKanbanStatusMove(app, 'interviewing')).toEqual({ app, status: 'interviewing' });
    expect(getKanbanStatusMove(app, 'applied')).toBeNull();
    expect(getKanbanStatusMove(interviewingApp, 'interviewing')).toBeNull();
    expect(getKanbanStatusMove(app, 'unknown')).toBeNull();
    expect(getKanbanStatusMove(undefined, 'interviewing')).toBeNull();
  });

  it('limits each lane preview and provides a way to show the remaining cards', () => {
    const applications = Array.from({ length: 7 }, (_, index) => (
      makeApplication({
        id: `11111111-1111-4111-8111-${String(index).padStart(12, '0')}`,
        company: `Company ${index + 1}`,
        status: 'applied',
      })
    ));
    const markup = renderToStaticMarkup(
      <ApplicationsKanbanBoard
        applications={applications}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onStatusChange={vi.fn()}
        deletingId={null}
      />,
    );

    expect(markup).toContain('Company 1');
    expect(markup).toContain(`Company ${KANBAN_COLLAPSED_CARD_LIMIT}`);
    expect(markup).not.toContain(`Company ${KANBAN_COLLAPSED_CARD_LIMIT + 1}`);
    expect(markup).not.toContain('Company 7');
    expect(markup).toContain('View 3 more');
    expect(markup).not.toContain('Show fewer');
  });
});
