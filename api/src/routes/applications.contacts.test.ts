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

const USER_ID = '00000000-0000-4000-8000-000000000001';
const APPLICATION_ID = '11111111-1111-4111-8111-111111111111';
const CONTACT_ID = '22222222-2222-4222-8222-222222222222';

type Row = Record<string, unknown> & { id?: string };

class Query {
  private filters: Array<[string, string]> = [];
  private insertPayload: Row | null = null;
  private deleteRequested = false;

  constructor(
    private readonly table: string,
    private readonly rowsByTable: Record<string, Row[]>,
  ) {}

  select() {
    return this;
  }

  eq(column: string, value: string) {
    this.filters.push([column, value]);
    return this;
  }

  insert(payload: Row) {
    this.insertPayload = payload;
    const row = { id: `${this.table}-new`, ...payload };
    this.rowsByTable[this.table] = [...(this.rowsByTable[this.table] ?? []), row];
    return this;
  }

  delete() {
    this.deleteRequested = true;
    return this;
  }

  async single() {
    return { data: this.apply()[0] ?? null, error: null };
  }

  then(
    resolve: (value: { data: Row[] | null; error: null }) => void,
    reject?: (reason: unknown) => void,
  ) {
    const rows = this.apply();
    const data = this.deleteRequested ? null : rows;
    return Promise.resolve({ data, error: null }).then(resolve, reject);
  }

  private apply(): Row[] {
    if (this.insertPayload) {
      return this.filterRows();
    }

    const matched = this.filterRows();
    if (this.deleteRequested) {
      this.rowsByTable[this.table] = (this.rowsByTable[this.table] ?? []).filter((row) => !matched.includes(row));
      return [];
    }

    return matched;
  }

  private filterRows(): Row[] {
    return (this.rowsByTable[this.table] ?? []).filter((row) =>
      this.filters.every(([column, value]) => row[column] === value),
    );
  }
}

function createMockDb(rowsByTable: Record<string, Row[]>) {
  return {
    rowsByTable,
    client: {
      from: vi.fn((table: string) => new Query(table, rowsByTable)),
    },
  };
}

describe('application contact link routes', () => {
  const app = createApp('test');

  beforeEach(() => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: USER_ID, email: 'test@example.com' } },
      error: null,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('links recruiter contacts to applications', async () => {
    const db = createMockDb({
      applications: [{ id: APPLICATION_ID, user_id: USER_ID }],
      contacts: [{ id: CONTACT_ID, user_id: USER_ID, contact_type: 'recruiter' }],
      application_contacts: [],
    });
    mockCreateUserClient.mockReturnValue(db.client);

    const response = await request(app)
      .post(`/api/applications/${APPLICATION_ID}/contacts`)
      .set('Authorization', 'Bearer test-token')
      .send({ contact_id: CONTACT_ID });

    expect(response.status).toBe(201);
    expect(db.rowsByTable.application_contacts).toContainEqual(expect.objectContaining({
      application_id: APPLICATION_ID,
      contact_id: CONTACT_ID,
      user_id: USER_ID,
    }));
  });

  it('rejects non-recruiter contacts when linking to applications', async () => {
    const db = createMockDb({
      applications: [{ id: APPLICATION_ID, user_id: USER_ID }],
      contacts: [{ id: CONTACT_ID, user_id: USER_ID, contact_type: 'company_contact' }],
      application_contacts: [],
    });
    mockCreateUserClient.mockReturnValue(db.client);

    const response = await request(app)
      .post(`/api/applications/${APPLICATION_ID}/contacts`)
      .set('Authorization', 'Bearer test-token')
      .send({ contact_id: CONTACT_ID });

    expect(response.status).toBe(400);
    expect(db.rowsByTable.application_contacts).toHaveLength(0);
  });

  it('unlinks recruiter contacts from applications', async () => {
    const db = createMockDb({
      applications: [{ id: APPLICATION_ID, user_id: USER_ID }],
      application_contacts: [{
        id: 'link-1',
        application_id: APPLICATION_ID,
        contact_id: CONTACT_ID,
        user_id: USER_ID,
      }],
    });
    mockCreateUserClient.mockReturnValue(db.client);

    const response = await request(app)
      .delete(`/api/applications/${APPLICATION_ID}/contacts/${CONTACT_ID}`)
      .set('Authorization', 'Bearer test-token');

    expect(response.status).toBe(200);
    expect(db.rowsByTable.application_contacts).toHaveLength(0);
  });
});
