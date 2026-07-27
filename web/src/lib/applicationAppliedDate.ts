import type { ApplicationStatus } from '@shared/schemas';

export function getAppliedDateForStatusChange({
  previousStatus,
  nextStatus,
  currentAppliedDate,
  today,
}: {
  previousStatus: ApplicationStatus;
  nextStatus: ApplicationStatus;
  currentAppliedDate: string | null | undefined;
  today: string;
}): string | null | undefined {
  if (nextStatus === 'applied' && previousStatus !== 'applied') {
    return today;
  }

  return currentAppliedDate;
}
