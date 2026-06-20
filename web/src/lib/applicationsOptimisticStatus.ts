import type { Application, ApplicationStatus } from '@shared/schemas';

export type OptimisticApplicationPatch = Partial<Pick<Application, 'status' | 'applied_date' | 'updated_at'>>;
export type OptimisticStatuses = Record<string, OptimisticApplicationPatch>;

export function applyOptimisticStatus(
  current: OptimisticStatuses,
  applicationId: string,
  status: ApplicationStatus,
): OptimisticStatuses {
  return applyOptimisticApplicationPatch(current, applicationId, { status });
}

export function applyOptimisticApplicationPatch(
  current: OptimisticStatuses,
  applicationId: string,
  patch: OptimisticApplicationPatch,
): OptimisticStatuses {
  return { ...current, [applicationId]: { ...current[applicationId], ...patch } };
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
    const patch = next[app.id];
    if (patch && isOptimisticPatchConfirmed(app, patch)) {
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
    const patch = optimisticStatuses[app.id];
    return patch ? { ...app, ...patch } : app;
  });
}

function isOptimisticPatchConfirmed(app: Application, patch: OptimisticApplicationPatch): boolean {
  if (patch.status && app.status !== patch.status) return false;
  if (patch.applied_date !== undefined && app.applied_date !== patch.applied_date) return false;

  return true;
}
