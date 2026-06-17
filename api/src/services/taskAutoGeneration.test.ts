import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  addBusinessDays,
  createApplicationDoubleDownTask,
  createDoubleDownFollowUpTask,
  createFindEngineeringLeadTask,
  createReferralThankYouTask,
  type TaskAutoGenerationDb,
} from './taskAutoGeneration';

type Row = Record<string, unknown>;

class SelectQuery {
  private filters: Array<[string, string]> = [];

  constructor(private readonly rows: Row[]) {}

  eq(column: string, value: string) {
    this.filters.push([column, value]);
    return this;
  }

  async single() {
    const row = this.rows.find((candidate) =>
      this.filters.every(([column, value]) => candidate[column] === value),
    );
    return { data: row ?? null, error: null };
  }
}

function createMockDb(rowsByTable: Record<string, Row[]>): TaskAutoGenerationDb & { inserted: Record<string, Row[]> } {
  const inserted: Record<string, Row[]> = {};

  return {
    inserted,
    from(table: string) {
      return {
        select() {
          return new SelectQuery(rowsByTable[table] ?? []);
        },
        async insert(payload: Row) {
          inserted[table] = [...(inserted[table] ?? []), payload];
          rowsByTable[table] = [...(rowsByTable[table] ?? []), payload];
          return { data: payload, error: null };
        },
      };
    },
  };
}

describe('addBusinessDays', () => {
  it('skips weekends', () => {
    const result = addBusinessDays(new Date('2026-05-14T12:00:00.000Z'), 2);
    expect(result.toISOString().split('T')[0]).toBe('2026-05-18');
  });

  it('handles multi-week spans', () => {
    const result = addBusinessDays(new Date('2026-05-11T12:00:00.000Z'), 10);
    expect(result.toISOString().split('T')[0]).toBe('2026-05-25');
  });

  it('handles spans that start on a Friday', () => {
    const result = addBusinessDays(new Date('2026-05-15T12:00:00.000Z'), 1);
    expect(result.toISOString().split('T')[0]).toBe('2026-05-18');
  });
});

describe('task auto-generation', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('createDoubleDownFollowUpTask sets due_date to exactly today + 4 business days', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-11T12:00:00.000Z'));
    const db = createMockDb({
      contacts: [{
        id: 'contact-1',
        user_id: 'user-1',
        first_name: 'Ada',
        last_name: 'Lovelace',
      }],
    });

    const result = await createDoubleDownFollowUpTask(db, 'contact-1', 'user-1', 'app-1');

    expect(result.error).toBeNull();
    expect(result.created).toBe(true);
    expect(db.inserted.tasks).toContainEqual(expect.objectContaining({
      title: 'Send follow-up to Ada Lovelace',
      due_date: '2026-05-15',
      application_id: 'app-1',
      contact_id: 'contact-1',
    }));
  });

  it('createApplicationDoubleDownTask does not fire when application_type is not cold_strategic', async () => {
    const db = createMockDb({
      applications: [{
        id: 'app-1',
        user_id: 'user-1',
        company: 'Acme',
        application_type: 'referral',
      }],
    });

    const result = await createApplicationDoubleDownTask(db, 'app-1', 'user-1');

    expect(result.error).toBeNull();
    expect(result.created).toBe(false);
    expect(db.inserted.tasks).toBeUndefined();
  });

  it('createApplicationDoubleDownTask creates same-day task for cold strategic applications', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-11T12:00:00.000Z'));
    const db = createMockDb({
      applications: [{
        id: 'app-1',
        user_id: 'user-1',
        company: 'Acme',
        application_type: 'cold_strategic',
      }],
    });

    const result = await createApplicationDoubleDownTask(db, 'app-1', 'user-1');

    expect(result.error).toBeNull();
    expect(result.created).toBe(true);
    expect(db.inserted.tasks).toContainEqual(expect.objectContaining({
      title: 'Send double-down email to Acme contact',
      priority: 'high',
      due_date: '2026-05-11',
      application_id: 'app-1',
    }));
  });

  it('createFindEngineeringLeadTask creates a next-day task for cold strategic applications without linked contacts', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-11T12:00:00.000Z'));
    const db = createMockDb({
      applications: [{
        id: 'app-1',
        user_id: 'user-1',
        company: 'Acme',
        application_type: 'cold_strategic',
      }],
      contacts: [],
      application_contacts: [],
      tasks: [],
    });

    const result = await createFindEngineeringLeadTask(db, 'app-1', 'user-1');

    expect(result.error).toBeNull();
    expect(result.created).toBe(true);
    expect(db.inserted.tasks).toContainEqual(expect.objectContaining({
      title: 'Find engineering lead at Acme for double-down',
      category: 'research',
      priority: 'high',
      due_date: '2026-05-12',
      application_id: 'app-1',
      contact_id: null,
    }));
  });

  it('no-contact cold strategic task is created once and not duplicated', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-11T12:00:00.000Z'));
    const db = createMockDb({
      applications: [{
        id: 'app-1',
        user_id: 'user-1',
        company: 'Acme',
        application_type: 'cold_strategic',
      }],
      contacts: [],
      application_contacts: [],
      tasks: [],
    });

    const firstResult = await createFindEngineeringLeadTask(db, 'app-1', 'user-1');
    const secondResult = await createFindEngineeringLeadTask(db, 'app-1', 'user-1');

    expect(firstResult.error).toBeNull();
    expect(firstResult.created).toBe(true);
    expect(secondResult.error).toBeNull();
    expect(secondResult.created).toBe(false);
    expect(db.inserted.tasks).toHaveLength(1);
    expect(db.inserted.tasks[0]).toMatchObject({
      title: 'Find engineering lead at Acme for double-down',
      application_id: 'app-1',
    });
  });

  it('recruiter-assisted applications do not create time-based follow-up tasks in V2', async () => {
    const db = createMockDb({
      applications: [{
        id: 'app-1',
        user_id: 'user-1',
        company: 'Acme',
        application_type: 'recruiter_assisted',
      }],
      contacts: [],
      application_contacts: [],
      tasks: [],
    });

    const result = await createFindEngineeringLeadTask(db, 'app-1', 'user-1');

    expect(result.error).toBeNull();
    expect(result.created).toBe(false);
    expect(db.inserted.tasks).toBeUndefined();
  });

  it('createFindEngineeringLeadTask does not create a task when the application already has a linked contact', async () => {
    const db = createMockDb({
      applications: [{
        id: 'app-1',
        user_id: 'user-1',
        company: 'Acme',
        application_type: 'cold_strategic',
      }],
      contacts: [{
        id: 'contact-1',
        user_id: 'user-1',
        application_id: 'app-1',
      }],
      application_contacts: [],
      tasks: [],
    });

    const result = await createFindEngineeringLeadTask(db, 'app-1', 'user-1');

    expect(result.error).toBeNull();
    expect(result.created).toBe(false);
    expect(db.inserted.tasks).toBeUndefined();
  });

  it('createReferralThankYouTask creates a same-day thank-you task for a referral application and referral contact', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-11T12:00:00.000Z'));
    const db = createMockDb({
      applications: [{
        id: 'app-1',
        user_id: 'user-1',
        application_type: 'referral',
      }],
      contacts: [{
        id: 'contact-1',
        user_id: 'user-1',
        first_name: 'Grace',
        last_name: 'Hopper',
        how_found: 'referral',
      }],
      tasks: [],
    });

    const result = await createReferralThankYouTask(db, 'app-1', 'contact-1', 'user-1');

    expect(result.error).toBeNull();
    expect(result.created).toBe(true);
    expect(db.inserted.tasks).toContainEqual(expect.objectContaining({
      title: 'Send thank-you note to Grace Hopper',
      category: 'outreach',
      priority: 'medium',
      due_date: '2026-05-11',
      application_id: 'app-1',
      contact_id: 'contact-1',
    }));
  });

  it('referral thank-you task is created only for referral applications', async () => {
    const db = createMockDb({
      applications: [{
        id: 'app-1',
        user_id: 'user-1',
        application_type: 'cold_strategic',
      }],
      contacts: [{
        id: 'contact-1',
        user_id: 'user-1',
        how_found: 'referral',
      }],
      tasks: [],
    });

    const result = await createReferralThankYouTask(db, 'app-1', 'contact-1', 'user-1');

    expect(result.error).toBeNull();
    expect(result.created).toBe(false);
    expect(db.inserted.tasks).toBeUndefined();
  });
});
