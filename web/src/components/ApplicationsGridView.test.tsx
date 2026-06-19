import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import type { Application } from '@shared/schemas';
import { ApplicationCardList } from './ApplicationCardList';
import { ApplicationsTable, sortForColumn } from './ApplicationsTable';

const application: Application = {
  id: '11111111-1111-4111-8111-111111111111',
  user_id: '22222222-2222-4222-8222-222222222222',
  company: 'Acme Robotics',
  title: 'Controls Engineering Intern',
  industry: 'Robotics',
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
  pay: '$24/hr',
  added: '2026-02-01',
  applied_date: '2026-02-03',
  deadline: null,
  created_at: '2026-02-01T12:00:00.000Z',
  updated_at: '2026-02-03T12:00:00.000Z',
};

describe('Applications grid view preservation', () => {
  it('renders the desktop table with sortable data headers and row actions', () => {
    const markup = renderToStaticMarkup(
      <ApplicationsTable
        applications={[application]}
        sort="added_desc"
        onSort={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        deletingId={null}
      />,
    );

    expect(markup).toContain('Application');
    expect(markup).toContain('Status');
    expect(markup).toContain('Applied');
    expect(markup).toContain('Added');
    expect(markup).toContain('Location');
    expect(markup).toContain('Newest');
    expect(markup).toContain('Acme Robotics');
    expect(markup).toContain('Controls Engineering Intern');
    expect(markup).toContain('Edit');
    expect(markup).toContain('aria-label="Delete"');
  });

  it('keeps every grid data column sortable in both directions', () => {
    expect(sortForColumn('company', 'company_asc')).toBe('company_desc');
    expect(sortForColumn('company', 'added_desc')).toBe('company_asc');
    expect(sortForColumn('status', 'status_asc')).toBe('status_desc');
    expect(sortForColumn('status', 'added_desc')).toBe('status_asc');
    expect(sortForColumn('applied', 'applied_desc')).toBe('applied_asc');
    expect(sortForColumn('applied', 'added_desc')).toBe('applied_desc');
    expect(sortForColumn('added', 'added_desc')).toBe('added_asc');
    expect(sortForColumn('added', 'company_asc')).toBe('added_desc');
    expect(sortForColumn('location', 'location_asc')).toBe('location_desc');
    expect(sortForColumn('location', 'added_desc')).toBe('location_asc');
  });

  it('keeps the mobile card list data and actions available for Grid view', () => {
    const markup = renderToStaticMarkup(
      <ApplicationCardList
        applications={[application]}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        deletingId={null}
      />,
    );

    expect(markup).toContain('Acme Robotics');
    expect(markup).toContain('Controls Engineering Intern');
    expect(markup).toContain('Pasadena, CA');
    expect(markup).toContain('Applied');
    expect(markup).toContain('Edit');
    expect(markup).toContain('aria-label="Delete"');
  });
});
