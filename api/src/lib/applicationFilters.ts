export interface ApplicationListFilters {
  status?: string;
  application_type?: string;
  search?: string;
  date_from?: string;
  date_to?: string;
}

// Minimal fluent-query interface. Both the Supabase PostgrestFilterBuilder
// and the test spy satisfy it — the generic Q preserves the concrete type so
// callers can continue chaining (e.g. .range()) after this function returns.
type FilterMethods<Q> = {
  eq(col: string, val: string): Q;
  ilike(col: string, pattern: string): Q;
  gte(col: string, val: string): Q;
  lte(col: string, val: string): Q;
};

export function applyApplicationFilters<Q extends FilterMethods<Q>>(
  query: Q,
  filters: ApplicationListFilters,
): Q {
  if (filters.status) query = query.eq('status', filters.status);
  if (filters.application_type) query = query.eq('application_type', filters.application_type);
  if (filters.search) query = query.ilike('company', `%${filters.search}%`);
  if (filters.date_from) query = query.gte('applied_date', filters.date_from);
  if (filters.date_to) query = query.lte('applied_date', filters.date_to);
  return query;
}
