import { describe, expect, it } from 'vitest';
import { getApplicationsContentState } from './applicationsContentState';

describe('getApplicationsContentState', () => {
  it('uses the shared loading, onboarding empty, filtered empty, and list states', () => {
    expect(getApplicationsContentState({ isLoading: true, total: 0, hasFilters: false })).toBe('loading');
    expect(getApplicationsContentState({ isLoading: false, total: 0, hasFilters: false })).toBe('onboarding-empty');
    expect(getApplicationsContentState({ isLoading: false, total: 0, hasFilters: true })).toBe('filtered-empty');
    expect(getApplicationsContentState({ isLoading: false, total: 1, hasFilters: true })).toBe('list');
  });
});
