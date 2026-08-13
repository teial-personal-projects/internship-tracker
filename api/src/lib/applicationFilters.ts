export interface ApplicationListFilters {
  status?: string;
  search?: string;
  date_from?: string;
  date_to?: string;
  exclude_archive?: boolean;
}

// Minimal fluent-query interface. Both the Supabase PostgrestFilterBuilder
// and the test spy satisfy it — the generic Q preserves the concrete type so
// callers can continue chaining (e.g. .range()) after this function returns.
type FilterMethods<Q> = {
  eq(col: string, val: string): Q;
  neq(col: string, val: string): Q;
  or(filters: string): Q;
  gte(col: string, val: string): Q;
  lte(col: string, val: string): Q;
};

function escapePostgrestSearch(value: string): string {
  return value
    .replaceAll('\\', '\\\\')
    .replaceAll('"', '\\"')
    .replaceAll('%', '\\%')
    .replaceAll('_', '\\_');
}

export function applyApplicationFilters<Q extends FilterMethods<Q>>(
  query: Q,
  filters: ApplicationListFilters,
): Q {
  if (filters.status) query = query.eq('status', filters.status);
  if (filters.exclude_archive && !filters.status) query = query.neq('status', 'archive');
  if (filters.search) {
    const pattern = `"%${escapePostgrestSearch(filters.search)}%"`;
    query = query.or(`company.ilike.${pattern},title.ilike.${pattern},location.ilike.${pattern}`);
  }
  if (filters.date_from) query = query.gte('applied_date', filters.date_from);
  if (filters.date_to) query = query.lte('applied_date', filters.date_to);
  return query;
}
