export interface PageSlice {
  from: number;
  to: number;
}

/** Returns the zero-based inclusive row range for a Supabase .range() call. */
export function computePageRange(page: number, limit: number): PageSlice {
  const from = (page - 1) * limit;
  return { from, to: from + limit - 1 };
}

/** Returns the total number of pages, always at least 1. */
export function computeTotalPages(total: number, limit: number): number {
  return Math.max(1, Math.ceil(total / limit));
}
