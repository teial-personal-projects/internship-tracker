export type ApplicationsContentState = 'loading' | 'onboarding-empty' | 'filtered-empty' | 'list';

export function getApplicationsContentState({
  isLoading,
  total,
  hasFilters,
}: {
  isLoading: boolean;
  total: number;
  hasFilters: boolean;
}): ApplicationsContentState {
  if (isLoading) return 'loading';
  if (total === 0 && !hasFilters) return 'onboarding-empty';
  if (total === 0) return 'filtered-empty';
  return 'list';
}
