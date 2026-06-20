import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ActionItemsPanel } from './ActionItemsPanel';
import { FunnelPanel } from './FunnelPanel';
import { NeedAttentionPanel } from './NeedAttentionPanel';
import { OverdueFollowupsPanel } from './OverdueFollowupsPanel';
import { RecentContactsPanel } from './RecentContactsPanel';
import { StatCards } from './StatCards';
import { UpNextCard } from './UpNextCard';

describe('Phase 4 zero-data Today states', () => {
  it('renders empty states without null or undefined text', () => {
    const queryClient = new QueryClient();
    const markup = renderToStaticMarkup(
      <QueryClientProvider client={queryClient}>
        <StatCards
          stats={{
            applications: 0,
            phone_screens: 0,
            open_tasks: 0,
            interviews_this_week: 0,
          }}
        />
        <UpNextCard interview={null} />
        <ActionItemsPanel actionItems={[]} totalOpenTasks={0} />
        <NeedAttentionPanel applications={[]} />
        <FunnelPanel
          buckets={[
            { key: 'applied', label: 'Applied', count: 0, percent: 0 },
            { key: 'screening', label: 'Screening', count: 0, percent: 0 },
            { key: 'interviewing', label: 'Interviewing', count: 0, percent: 0 },
            { key: 'offered', label: 'Offered', count: 0, percent: 0 },
          ]}
        />
        <OverdueFollowupsPanel contacts={[]} />
        <RecentContactsPanel contacts={[]} />
      </QueryClientProvider>,
    );

    expect(markup).toContain('No applications yet');
    expect(markup).toContain('No interviews scheduled.');
    expect(markup).toContain('No open action items.');
    expect(markup).toContain('No active applications right now.');
    expect(markup).toContain('No applications in this cycle yet.');
    expect(markup).toContain('current on follow-ups');
    expect(markup).toContain('No contacts yet.');
    expect(markup).not.toMatch(/\b(null|undefined)\b/i);
  });
});
