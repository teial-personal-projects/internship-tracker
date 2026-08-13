import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { ApplicationsFilters } from './ApplicationsFilters';

describe('ApplicationsFilters', () => {
  it('renders searchable, count-aware application controls', () => {
    const markup = renderToStaticMarkup(
      <ApplicationsFilters
        search="Acme"
        status="applied"
        dateFrom="2026-01-01"
        dateTo="2026-08-01"
        sort="company_asc"
        statusCounts={{ applied: 5, interviewing: 2 }}
        onSearchChange={vi.fn()}
        onStatusChange={vi.fn()}
        onDateFromChange={vi.fn()}
        onDateToChange={vi.fn()}
        onSortChange={vi.fn()}
        onReset={vi.fn()}
      />,
    );

    expect(markup).toContain('Search company, role, or location');
    expect(markup).toContain('value="Acme"');
    expect(markup).toContain('Filter by status');
    expect(markup).toContain('Applied (5)');
    expect(markup).toContain('Interviewing (2)');
    expect(markup).toContain('Applied from');
    expect(markup).toContain('Sort applications');
    expect(markup).toContain('Company A–Z');
    expect(markup).toContain('Reset');
  });
});
