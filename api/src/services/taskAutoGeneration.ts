export interface TaskAutoGenerationDb {
  from(table: string): {
    select(columns?: string): unknown;
    insert(payload: Record<string, unknown>): PromiseLike<{ data?: unknown; error: { message: string } | null }>;
  };
}

interface SelectQuery {
  eq(column: string, value: string): SelectQuery;
  single(): Promise<{ data: unknown; error: { message: string } | null }>;
}

interface ContactRow {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
}

interface ApplicationRow {
  id: string;
  company?: string | null;
  application_type?: string | null;
}

function toSelectQuery(value: unknown): SelectQuery {
  return value as SelectQuery;
}

function toIsoDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function addBusinessDays(startDate: Date, days: number): Date {
  const next = new Date(startDate);
  let remaining = days;

  while (remaining > 0) {
    next.setDate(next.getDate() + 1);
    const day = next.getDay();
    if (day !== 0 && day !== 6) {
      remaining -= 1;
    }
  }

  return next;
}

export async function createDoubleDownFollowUpTask(
  db: TaskAutoGenerationDb,
  contactId: string,
  userId: string,
  applicationId: string | null,
): Promise<{ created: boolean; error: { message: string } | null }> {
  const contactQuery = toSelectQuery(db.from('contacts').select('id, first_name, last_name'));
  const { data: contact, error: contactError } = await contactQuery
    .eq('id', contactId)
    .eq('user_id', userId)
    .single();

  if (contactError || !contact) {
    return { created: false, error: contactError ?? { message: 'Contact not found' } };
  }

  const contactRow = contact as ContactRow;
  const name = `${contactRow.first_name ?? ''} ${contactRow.last_name ?? ''}`.trim() || 'contact';
  const { error } = await db.from('tasks').insert({
    user_id: userId,
    title: `Send follow-up to ${name}`,
    category: 'outreach',
    priority: 'high',
    status: 'open',
    due_date: toIsoDate(addBusinessDays(new Date(), 4)),
    application_id: applicationId,
    contact_id: contactId,
    is_auto_generated: true,
  });

  return { created: !error, error };
}

export async function createApplicationDoubleDownTask(
  db: TaskAutoGenerationDb,
  applicationId: string,
  userId: string,
): Promise<{ created: boolean; error: { message: string } | null }> {
  const applicationQuery = toSelectQuery(db.from('applications').select('id, company, application_type'));
  const { data: application, error: applicationError } = await applicationQuery
    .eq('id', applicationId)
    .eq('user_id', userId)
    .single();

  if (applicationError || !application) {
    return { created: false, error: applicationError ?? { message: 'Application not found' } };
  }

  const applicationRow = application as ApplicationRow;
  if (applicationRow.application_type !== 'cold_strategic') {
    return { created: false, error: null };
  }

  const company = applicationRow.company?.trim() || 'company';
  const { error } = await db.from('tasks').insert({
    user_id: userId,
    title: `Send double-down email to ${company} contact`,
    category: 'outreach',
    priority: 'high',
    status: 'open',
    due_date: toIsoDate(new Date()),
    application_id: applicationId,
    contact_id: null,
    is_auto_generated: true,
  });

  return { created: !error, error };
}
