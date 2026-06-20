export interface TaskAutoGenerationDb {
  from(table: string): {
    select(columns?: string): unknown;
    insert(payload: Record<string, unknown>): PromiseLike<{ data?: unknown; error: { message: string } | null }>;
  };
}

interface SelectQuery {
  eq(column: string, value: string): SelectQuery;
  single(): Promise<{ data: unknown; error: { message: string } | null }>;
  maybeSingle(): Promise<{ data: unknown; error: { message: string } | null }>;
}

interface ContactRow {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  how_found?: string | null;
}

interface ApplicationRow {
  id: string;
  company?: string | null;
  application_type?: string | null;
}

interface TaskRow {
  id: string;
}

function toSelectQuery(value: unknown): SelectQuery {
  return value as SelectQuery;
}

function toIsoDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function addCalendarDays(startDate: Date, days: number): Date {
  const next = new Date(startDate);
  next.setDate(next.getDate() + days);
  return next;
}

function contactName(contact: ContactRow): string {
  return `${contact.first_name ?? ''} ${contact.last_name ?? ''}`.trim() || 'referral contact';
}

async function hasExistingTask(
  db: TaskAutoGenerationDb,
  userId: string,
  applicationId: string,
  title: string,
): Promise<boolean> {
  const taskQuery = toSelectQuery(db.from('tasks').select('id'));
  const { data } = await taskQuery
    .eq('user_id', userId)
    .eq('application_id', applicationId)
    .eq('title', title)
    .eq('status', 'open')
    .single();

  return Boolean(data as TaskRow | null);
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

export async function createFindEngineeringLeadTask(
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

  const directContactQuery = toSelectQuery(db.from('contacts').select('id'));
  const { data: directContact, error: directContactError } = await directContactQuery
    .eq('application_id', applicationId)
    .eq('user_id', userId)
    .maybeSingle();

  if (directContactError) {
    return { created: false, error: directContactError };
  }
  if (directContact) {
    return { created: false, error: null };
  }

  const recruiterLinkQuery = toSelectQuery(db.from('application_contacts').select('id'));
  const { data: recruiterLink, error: recruiterLinkError } = await recruiterLinkQuery
    .eq('application_id', applicationId)
    .eq('user_id', userId)
    .maybeSingle();

  if (recruiterLinkError) {
    return { created: false, error: recruiterLinkError };
  }
  if (recruiterLink) {
    return { created: false, error: null };
  }

  const company = applicationRow.company?.trim() || 'company';
  const title = `Find engineering lead at ${company} for double-down`;
  if (await hasExistingTask(db, userId, applicationId, title)) {
    return { created: false, error: null };
  }

  const { error } = await db.from('tasks').insert({
    user_id: userId,
    title,
    category: 'research',
    priority: 'high',
    status: 'open',
    due_date: toIsoDate(addCalendarDays(new Date(), 1)),
    application_id: applicationId,
    contact_id: null,
    is_auto_generated: true,
  });

  return { created: !error, error };
}

export async function createReferralThankYouTask(
  db: TaskAutoGenerationDb,
  applicationId: string,
  contactId: string,
  userId: string,
): Promise<{ created: boolean; error: { message: string } | null }> {
  const applicationQuery = toSelectQuery(db.from('applications').select('id, application_type'));
  const { data: application, error: applicationError } = await applicationQuery
    .eq('id', applicationId)
    .eq('user_id', userId)
    .single();

  if (applicationError || !application) {
    return { created: false, error: applicationError ?? { message: 'Application not found' } };
  }
  if ((application as ApplicationRow).application_type !== 'referral') {
    return { created: false, error: null };
  }

  const contactQuery = toSelectQuery(db.from('contacts').select('id, first_name, last_name, how_found'));
  const { data: contact, error: contactError } = await contactQuery
    .eq('id', contactId)
    .eq('user_id', userId)
    .single();

  if (contactError || !contact) {
    return { created: false, error: contactError ?? { message: 'Contact not found' } };
  }

  const contactRow = contact as ContactRow;
  if (contactRow.how_found !== 'referral') {
    return { created: false, error: null };
  }

  const title = `Send thank-you note to ${contactName(contactRow)}`;
  if (await hasExistingTask(db, userId, applicationId, title)) {
    return { created: false, error: null };
  }

  const { error } = await db.from('tasks').insert({
    user_id: userId,
    title,
    category: 'outreach',
    priority: 'medium',
    status: 'open',
    due_date: toIsoDate(new Date()),
    application_id: applicationId,
    contact_id: contactId,
    is_auto_generated: true,
  });

  return { created: !error, error };
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
