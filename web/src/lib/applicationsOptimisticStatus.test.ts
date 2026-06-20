import { describe, expect, it } from 'vitest';
import type { Application } from '@shared/schemas';
import {
  applyOptimisticApplicationPatch,
  applyOptimisticStatus,
  applyOptimisticStatuses,
  reconcileOptimisticStatuses,
  rollbackOptimisticStatus,
} from './applicationsOptimisticStatus';

const application: Application = {
  id: '11111111-1111-4111-8111-111111111111',
  user_id: '22222222-2222-4222-8222-222222222222',
  company: 'Acme Robotics',
  title: 'Controls Engineering Intern',
  industry: null,
  location: null,
  job_link: null,
  app_link: null,
  status: 'applied',
  application_type: 'referral',
  source: 'manual',
  source_metadata: {},
  cover_letter: null,
  notes: null,
  pay: null,
  added: '2026-02-01',
  applied_date: null,
  deadline: null,
  created_at: '2026-02-01T12:00:00.000Z',
  updated_at: '2026-02-03T12:00:00.000Z',
};

describe('applications optimistic status helpers', () => {
  it('applies an optimistic status so the card moves immediately', () => {
    const optimistic = applyOptimisticStatus({}, application.id, 'interviewing');

    expect(applyOptimisticStatuses([application], optimistic)[0].status).toBe('interviewing');
  });

  it('applies optimistic applied date and updated date fields', () => {
    const optimistic = applyOptimisticApplicationPatch({}, application.id, {
      status: 'applied',
      applied_date: '2026-06-20',
      updated_at: '2026-06-20T12:00:00.000Z',
    });

    expect(applyOptimisticStatuses([application], optimistic)[0]).toMatchObject({
      status: 'applied',
      applied_date: '2026-06-20',
      updated_at: '2026-06-20T12:00:00.000Z',
    });
  });

  it('rolls back a failed status update to the server-backed status', () => {
    const optimistic = applyOptimisticStatus({}, application.id, 'interviewing');
    const rolledBack = rollbackOptimisticStatus(optimistic, application.id);

    expect(applyOptimisticStatuses([application], rolledBack)[0].status).toBe('applied');
  });

  it('clears optimistic state after refetched data confirms the new status', () => {
    const optimistic = applyOptimisticStatus({}, application.id, 'interviewing');
    const confirmed = { ...application, status: 'interviewing' as const };

    expect(reconcileOptimisticStatuses(optimistic, [confirmed])).toEqual({});
  });

  it('clears optimistic applied moves even when the server returns its own updated_at timestamp', () => {
    const optimistic = applyOptimisticApplicationPatch({}, application.id, {
      status: 'applied',
      applied_date: '2026-06-20',
      updated_at: '2026-06-20T12:00:00.000Z',
    });
    const confirmed = {
      ...application,
      applied_date: '2026-06-20',
      updated_at: '2026-06-20T12:00:01.000Z',
    };

    expect(reconcileOptimisticStatuses(optimistic, [confirmed])).toEqual({});
  });

  it('keeps optimistic state while refetched data has not caught up', () => {
    const optimistic = applyOptimisticStatus({}, application.id, 'interviewing');

    expect(reconcileOptimisticStatuses(optimistic, [application])).toBe(optimistic);
  });
});
