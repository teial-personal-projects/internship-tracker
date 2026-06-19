import { describe, expect, it } from 'vitest';
import { getPaginationRange } from './Pagination';

describe('getPaginationRange', () => {
  it('shows the correct item range for a page from ?page=N', () => {
    expect(getPaginationRange(3, 62, 25)).toEqual({ start: 51, end: 62 });
  });

  it('shows zero results when total is zero', () => {
    expect(getPaginationRange(1, 0, 25)).toEqual({ start: 0, end: 0 });
  });
});
