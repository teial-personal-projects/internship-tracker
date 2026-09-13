import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ApplicationTypeSchema } from '@shared/schemas';
import { ApplicationTypeBadge } from './ApplicationTypeBadge';

describe('ApplicationTypeBadge', () => {
  it('renders Posse Portal as a supported application type', () => {
    const applicationType = ApplicationTypeSchema.parse('posse_portal');
    const markup = renderToStaticMarkup(<ApplicationTypeBadge type={applicationType} />);

    expect(markup).toContain('Posse Portal');
  });
});
