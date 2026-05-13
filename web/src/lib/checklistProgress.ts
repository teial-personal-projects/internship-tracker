import type { Application } from '@shared/schemas';

export const CHECKLIST_TOTAL = 18;

export function checklistDoneCount(application: Application): number {
  return Object.values(application.checklist_state ?? {}).filter((value) => value === true).length;
}

export function checklistProgressPercent(application: Application): number {
  return Math.round((checklistDoneCount(application) / CHECKLIST_TOTAL) * 100);
}

export function checklistProgressColor(done: number): string {
  if (done === 0) return 'var(--ink-4)';
  if (done >= 15) return '#15803D';
  if (done >= 5) return '#A36410';
  return '#B5394A';
}
