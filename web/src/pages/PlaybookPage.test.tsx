import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { PlaybookPage } from './PlaybookPage';

vi.mock('@/components/AppHeader', () => ({
  AppHeader: () => <header>Test header</header>,
}));

describe('PlaybookPage', () => {
  it('renders the application method reference content', () => {
    const markup = renderToStaticMarkup(
      <MemoryRouter>
        <PlaybookPage />
      </MemoryRouter>,
    );

    expect(markup).toContain('Application loop');
    expect(markup).toContain('Before you apply');
    expect(markup).toContain('Day 0');
    expect(markup).toContain('Day 4-5');
    expect(markup).toContain('the cover letter differentiator');
    expect(markup).toContain('Double-down target');
    expect(markup).toContain('Manage your templates');
    expect(markup).not.toContain('type="checkbox"');
  });
});
