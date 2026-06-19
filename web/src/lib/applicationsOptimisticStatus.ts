import type { Application, ApplicationStatus } from '@shared/schemas';

export type OptimisticStatuses = Record<string, ApplicationStatus>;

export function applyOptimisticStatus(
  current: OptimisticStatuses,
  applicationId: string,
  status: ApplicationStatus,
): OptimisticStatuses {
  return { ...current, [applicationId]: status };
}

export function rollbackOptimisticStatus(
  current: OptimisticStatuses,
  applicationId: string,
): OptimisticStatuses {
  const next = { ...current };
  delete next[applicationId];
  return next;
}

export function reconcileOptimisticStatuses(
  current: OptimisticStatuses,
  applications: Application[],
): OptimisticStatuses {
  let changed = false;
  const next = { ...current };

  for (const app of applications) {
    if (next[app.id] && next[app.id] === app.status) {
      delete next[app.id];
      changed = true;
    }
  }

  return changed ? next : current;
}

export function applyOptimisticStatuses(
  applications: Application[],
  optimisticStatuses: OptimisticStatuses,
): Application[] {
  return applications.map((app) => {
    const status = optimisticStatuses[app.id];
    return status ? { ...app, status } : app;
  });
}
