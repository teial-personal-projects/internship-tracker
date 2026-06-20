import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { TodayTask } from '@shared/schemas';
import { ActionItemsPanel } from './ActionItemsPanel';

describe('ActionItemsPanel', () => {
  it('shows application type for application-linked tasks', () => {
    const queryClient = new QueryClient();
    const task = {
      id: 'task-1',
      title: 'Send follow-up',
      status: 'open',
      priority: 'high',
      due_date: '2026-06-19',
      application_company: 'Recruiter Co',
      application_title: 'Hardware Intern',
      application_type: 'recruiter_assisted',
      contact_name: null,
    } as TodayTask;

    const markup = renderToStaticMarkup(
      <QueryClientProvider client={queryClient}>
        <ActionItemsPanel actionItems={[task]} totalOpenTasks={1} />
      </QueryClientProvider>,
    );

    expect(markup).toContain('Recruiter Co');
    expect(markup).toContain('Hardware Intern');
    expect(markup).toContain('Recruiter');
  });
});
