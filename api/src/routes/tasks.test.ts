import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../app';

const mockGetUser = vi.hoisted(() => vi.fn());
const mockCreateUserClient = vi.hoisted(() => vi.fn());

vi.mock('../lib/supabase', () => ({
  supabaseAdmin: {
    auth: {
      getUser: mockGetUser,
    },
  },
  createUserClient: mockCreateUserClient,
}));

type TaskRow = Record<string, unknown> & {
  id: string;
  category: string;
  priority: 'high' | 'medium' | 'low';
  status: string;
  application_id?: string | null;
  due_date?: string | null;
};

interface QueryCall {
  method: string;
  args: unknown[];
}

class TasksQuery {
  readonly calls: QueryCall[] = [];

  constructor(private readonly rows: TaskRow[]) {}

  select(...args: unknown[]) {
    this.calls.push({ method: 'select', args });
    return this;
  }

  order(...args: unknown[]) {
    this.calls.push({ method: 'order', args });
    return this;
  }

  eq(...args: [string, string]) {
    this.calls.push({ method: 'eq', args });
    return this;
  }

  gte(...args: [string, string]) {
    this.calls.push({ method: 'gte', args });
    return this;
  }

  lte(...args: [string, string]) {
    this.calls.push({ method: 'lte', args });
    return this;
  }

  then(
    resolve: (value: { data: TaskRow[]; error: null }) => void,
    reject?: (reason: unknown) => void,
  ) {
    return Promise.resolve({ data: this.applyOrdering(this.applyFilters()), error: null }).then(resolve, reject);
  }

  private applyFilters(): TaskRow[] {
    return this.rows.filter((row) =>
      this.calls.every((call) => {
        const [column, value] = call.args as [keyof TaskRow, string];

        if (call.method === 'eq') {
          return row[column] === value;
        }
        if (call.method === 'gte') {
          const rowValue = row[column];
          return typeof rowValue === 'string' && rowValue >= value;
        }
        if (call.method === 'lte') {
          const rowValue = row[column];
          return typeof rowValue === 'string' && rowValue <= value;
        }
        return true;
      }),
    );
  }

  private applyOrdering(rows: TaskRow[]): TaskRow[] {
    const priorityRank: Record<TaskRow['priority'], number> = {
      high: 0,
      medium: 1,
      low: 2,
    };

    return [...rows].sort((left, right) => {
      const priorityCompare = priorityRank[left.priority] - priorityRank[right.priority];
      if (priorityCompare !== 0) return priorityCompare;
      return String(left.due_date ?? '9999-12-31').localeCompare(String(right.due_date ?? '9999-12-31'));
    });
  }
}

function createMockDb(query: TasksQuery) {
  return {
    from: vi.fn((table: string) => {
      expect(table).toBe('tasks');
      return query;
    }),
  };
}

type Row = Record<string, unknown> & { id?: string };

class Query {
  readonly calls: QueryCall[] = [];
  private insertPayload: Row | null = null;
  private insertedRow: Row | null = null;
  private updatePayload: Row | null = null;
  private deleteRequested = false;

  constructor(
    private readonly table: string,
    private readonly rowsByTable: Record<string, Row[]>,
  ) {}

  select(...args: unknown[]) {
    this.calls.push({ method: 'select', args });
    return this;
  }

  order(...args: unknown[]) {
    this.calls.push({ method: 'order', args });
    return this;
  }

  eq(...args: [string, string]) {
    this.calls.push({ method: 'eq', args });
    return this;
  }

  insert(payload: Row) {
    this.calls.push({ method: 'insert', args: [payload] });
    this.insertPayload = payload;
    this.insertedRow = { id: `${this.table}-new`, ...payload };
    this.rowsByTable[this.table] = [...(this.rowsByTable[this.table] ?? []), this.insertedRow];
    return this;
  }

  update(payload: Row) {
    this.calls.push({ method: 'update', args: [payload] });
    this.updatePayload = payload;
    return this;
  }

  delete() {
    this.calls.push({ method: 'delete', args: [] });
    this.deleteRequested = true;
    return this;
  }

  async single() {
    if (this.insertPayload) {
      return { data: this.insertedRow, error: null };
    }

    const row = this.applyWriteAndFilter()[0] ?? null;
    return { data: row, error: null };
  }

  then(
    resolve: (value: { data: Row[] | null; error: null }) => void,
    reject?: (reason: unknown) => void,
  ) {
    const rows = this.applyWriteAndFilter();
    return Promise.resolve({ data: this.deleteRequested ? null : rows, error: null }).then(resolve, reject);
  }

  private applyWriteAndFilter(): Row[] {
    const rows = this.rowsByTable[this.table] ?? [];
    const matched = this.applyFilters();

    if (this.updatePayload) {
      this.rowsByTable[this.table] = rows.map((row) =>
        matched.includes(row) ? { ...row, ...this.updatePayload } : row,
      );
      return this.applyFilters();
    }

    if (this.deleteRequested) {
      this.rowsByTable[this.table] = rows.filter((row) => !matched.includes(row));
      return [];
    }

    return matched;
  }

  private applyFilters(): Row[] {
    const rows = this.rowsByTable[this.table] ?? [];
    return rows.filter((row) =>
      this.calls.every((call) => {
        if (call.method !== 'eq') return true;
        const [column, value] = call.args as [string, string];
        return row[column] === value;
      }),
    );
  }
}

function createCrudMockDb(rowsByTable: Record<string, Row[]>) {
  const queries: Record<string, Query[]> = {};
  return {
    rowsByTable,
    queries,
    client: {
      from: vi.fn((table: string) => {
        const query = new Query(table, rowsByTable);
        queries[table] = [...(queries[table] ?? []), query];
        return query;
      }),
    },
  };
}

describe('GET /api/tasks', () => {
  const app = createApp('test');

  beforeEach(() => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-1', email: 'test@example.com' } },
      error: null,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('applies supported filters and inclusive due date bounds', async () => {
    const query = new TasksQuery([
      {
        id: 'before',
        category: 'outreach',
        priority: 'high',
        status: 'open',
        application_id: 'app-1',
        due_date: '2026-05-31',
      },
      {
        id: 'from',
        category: 'outreach',
        priority: 'high',
        status: 'open',
        application_id: 'app-1',
        due_date: '2026-06-01',
      },
      {
        id: 'inside',
        category: 'outreach',
        priority: 'high',
        status: 'open',
        application_id: 'app-1',
        due_date: '2026-06-15',
      },
      {
        id: 'other-category',
        category: 'research',
        priority: 'high',
        status: 'open',
        application_id: 'app-1',
        due_date: '2026-06-15',
      },
      {
        id: 'after',
        category: 'outreach',
        priority: 'high',
        status: 'open',
        application_id: 'app-1',
        due_date: '2026-07-01',
      },
    ]);
    mockCreateUserClient.mockReturnValue(createMockDb(query));

    const response = await request(app)
      .get('/api/tasks?category=outreach&priority=high&status=open&application_id=app-1&date_from=2026-06-01&date_to=2026-06-30')
      .set('Authorization', 'Bearer test-token');
    const body = response.body as { data: TaskRow[] };

    expect(response.status).toBe(200);
    expect(body.data.map((row) => row.id)).toEqual(['from', 'inside']);
    expect(query.calls).toContainEqual({ method: 'eq', args: ['category', 'outreach'] });
    expect(query.calls).toContainEqual({ method: 'eq', args: ['priority', 'high'] });
    expect(query.calls).toContainEqual({ method: 'eq', args: ['status', 'open'] });
    expect(query.calls).toContainEqual({ method: 'eq', args: ['application_id', 'app-1'] });
    expect(query.calls).toContainEqual({ method: 'gte', args: ['due_date', '2026-06-01'] });
    expect(query.calls).toContainEqual({ method: 'lte', args: ['due_date', '2026-06-30'] });
  });

  it('uses priority high to low, then due date ascending as the default sort', async () => {
    const query = new TasksQuery([
      {
        id: 'low-early',
        category: 'research',
        priority: 'low',
        status: 'open',
        due_date: '2026-06-01',
      },
      {
        id: 'high-late',
        category: 'research',
        priority: 'high',
        status: 'open',
        due_date: '2026-06-20',
      },
      {
        id: 'high-early',
        category: 'research',
        priority: 'high',
        status: 'open',
        due_date: '2026-06-10',
      },
      {
        id: 'medium',
        category: 'research',
        priority: 'medium',
        status: 'open',
        due_date: '2026-06-05',
      },
    ]);
    mockCreateUserClient.mockReturnValue(createMockDb(query));

    const response = await request(app)
      .get('/api/tasks')
      .set('Authorization', 'Bearer test-token');
    const body = response.body as { data: TaskRow[] };

    expect(response.status).toBe(200);
    expect(body.data.map((row) => row.id)).toEqual(['high-early', 'high-late', 'medium', 'low-early']);
    expect(query.calls).toContainEqual({ method: 'order', args: ['priority', { ascending: true }] });
    expect(query.calls).toContainEqual({ method: 'order', args: ['due_date', { ascending: true }] });
  });
});

describe('tasks CRUD routes', () => {
  const app = createApp('test');
  const userId = '00000000-0000-4000-8000-000000000001';
  const otherUserId = '00000000-0000-4000-8000-000000000002';
  const applicationId = '11111111-1111-4111-8111-111111111111';
  const contactId = '22222222-2222-4222-8222-222222222222';
  const taskId = '33333333-3333-4333-8333-333333333333';

  beforeEach(() => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: userId, email: 'test@example.com' } },
      error: null,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('POST /api/tasks creates a task after verifying linked application and contact ownership', async () => {
    const db = createCrudMockDb({
      applications: [{ id: applicationId, user_id: userId }],
      contacts: [{ id: contactId, user_id: userId }],
      tasks: [],
    });
    mockCreateUserClient.mockReturnValue(db.client);

    const response = await request(app)
      .post('/api/tasks')
      .set('Authorization', 'Bearer test-token')
      .send({
        title: 'Follow up',
        category: 'outreach',
        priority: 'high',
        status: 'open',
        due_date: '2026-06-20',
        application_id: applicationId,
        contact_id: contactId,
        notes: '<b>Send note</b>',
      });
    const body = response.body as { data: Row };

    expect(response.status).toBe(201);
    expect(body.data).toMatchObject({
      title: 'Follow up',
      category: 'outreach',
      priority: 'high',
      status: 'open',
      due_date: '2026-06-20',
      application_id: applicationId,
      contact_id: contactId,
      notes: 'Send note',
      user_id: userId,
    });
    expect(db.queries.applications[0].calls).toContainEqual({ method: 'eq', args: ['id', applicationId] });
    expect(db.queries.contacts[0].calls).toContainEqual({ method: 'eq', args: ['id', contactId] });
  });

  it('POST /api/tasks rejects a linked application owned by another user', async () => {
    const db = createCrudMockDb({
      applications: [{ id: applicationId, user_id: otherUserId }],
      contacts: [],
      tasks: [],
    });
    mockCreateUserClient.mockReturnValue(db.client);

    const response = await request(app)
      .post('/api/tasks')
      .set('Authorization', 'Bearer test-token')
      .send({
        title: 'Follow up',
        category: 'outreach',
        application_id: applicationId,
      });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'Application does not belong to current user' });
    expect(db.rowsByTable.tasks).toHaveLength(0);
  });

  it('GET /api/tasks/:id returns an owned task and rejects another user task', async () => {
    const db = createCrudMockDb({
      tasks: [
        { id: taskId, user_id: userId, title: 'Owned' },
        { id: 'other-task', user_id: otherUserId, title: 'Other' },
      ],
    });
    mockCreateUserClient.mockReturnValue(db.client);

    const ownedResponse = await request(app)
      .get(`/api/tasks/${taskId}`)
      .set('Authorization', 'Bearer test-token');
    const forbiddenResponse = await request(app)
      .get('/api/tasks/other-task')
      .set('Authorization', 'Bearer test-token');

    expect(ownedResponse.status).toBe(200);
    expect(ownedResponse.body).toEqual({ data: { id: taskId, user_id: userId, title: 'Owned' } });
    expect(forbiddenResponse.status).toBe(403);
    expect(forbiddenResponse.body).toEqual({ error: 'Task does not belong to current user' });
  });

  it('PATCH /api/tasks/:id updates status, priority, due date, and notes only', async () => {
    const db = createCrudMockDb({
      tasks: [
        {
          id: taskId,
          user_id: userId,
          title: 'Original title',
          category: 'outreach',
          priority: 'medium',
          status: 'open',
          due_date: '2026-06-10',
          notes: null,
        },
      ],
    });
    mockCreateUserClient.mockReturnValue(db.client);

    const response = await request(app)
      .patch(`/api/tasks/${taskId}`)
      .set('Authorization', 'Bearer test-token')
      .send({
        title: 'Ignored by schema',
        status: 'complete',
        priority: 'low',
        due_date: '2026-06-25',
        notes: '<i>Done</i>',
      });
    const body = response.body as { data: Row };

    expect(response.status).toBe(200);
    expect(body.data).toMatchObject({
      id: taskId,
      title: 'Original title',
      status: 'complete',
      priority: 'low',
      due_date: '2026-06-25',
      notes: 'Done',
    });
    expect(db.queries.tasks[1].calls).toContainEqual({ method: 'eq', args: ['id', taskId] });
    expect(db.queries.tasks[1].calls).toContainEqual({ method: 'eq', args: ['user_id', userId] });
  });

  it('DELETE /api/tasks/:id deletes only an owned task', async () => {
    const db = createCrudMockDb({
      tasks: [
        { id: taskId, user_id: userId, title: 'Owned' },
        { id: 'other-task', user_id: otherUserId, title: 'Other' },
      ],
    });
    mockCreateUserClient.mockReturnValue(db.client);

    const response = await request(app)
      .delete(`/api/tasks/${taskId}`)
      .set('Authorization', 'Bearer test-token');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ data: null });
    expect(db.rowsByTable.tasks).toEqual([{ id: 'other-task', user_id: otherUserId, title: 'Other' }]);
    expect(db.queries.tasks[1].calls).toContainEqual({ method: 'eq', args: ['id', taskId] });
    expect(db.queries.tasks[1].calls).toContainEqual({ method: 'eq', args: ['user_id', userId] });
  });
});
