import { describe, expect, it } from 'vitest';
import { applyApplicationFilters } from './applicationFilters';

interface SpyCall {
  method: string;
  args: unknown[];
}

// Chainable spy that satisfies the generic constraint in applyApplicationFilters.
function createQuerySpy() {
  const calls: SpyCall[] = [];
  const spy = {
    calls,
    eq(col: string, val: string)      { calls.push({ method: 'eq',    args: [col, val] }); return spy; },
    ilike(col: string, pat: string)   { calls.push({ method: 'ilike', args: [col, pat] }); return spy; },
    gte(col: string, val: string)     { calls.push({ method: 'gte',   args: [col, val] }); return spy; },
    lte(col: string, val: string)     { calls.push({ method: 'lte',   args: [col, val] }); return spy; },
  };
  return spy;
}

// ── 2.5.2 — date range filter ──────────────────────────────────────────────

describe('applyApplicationFilters — date range (2.5.2)', () => {
  it('calls gte + lte with applied_date when both bounds are provided', () => {
    const spy = createQuerySpy();
    applyApplicationFilters(spy, { date_from: '2025-01-01', date_to: '2025-12-31' });
    expect(spy.calls).toContainEqual({ method: 'gte', args: ['applied_date', '2025-01-01'] });
    expect(spy.calls).toContainEqual({ method: 'lte', args: ['applied_date', '2025-12-31'] });
  });

  it('calls only gte when only date_from is provided', () => {
    const spy = createQuerySpy();
    applyApplicationFilters(spy, { date_from: '2025-01-01' });
    expect(spy.calls.some(c => c.method === 'gte' && c.args[0] === 'applied_date')).toBe(true);
    expect(spy.calls.some(c => c.method === 'lte')).toBe(false);
  });

  it('calls only lte when only date_to is provided', () => {
    const spy = createQuerySpy();
    applyApplicationFilters(spy, { date_to: '2025-12-31' });
    expect(spy.calls.some(c => c.method === 'lte' && c.args[0] === 'applied_date')).toBe(true);
    expect(spy.calls.some(c => c.method === 'gte')).toBe(false);
  });

  it('passes the exact date string to gte/lte — inclusive bounds enforced by Supabase', () => {
    const spy = createQuerySpy();
    applyApplicationFilters(spy, { date_from: '2025-03-15', date_to: '2025-03-15' });
    expect(spy.calls).toContainEqual({ method: 'gte', args: ['applied_date', '2025-03-15'] });
    expect(spy.calls).toContainEqual({ method: 'lte', args: ['applied_date', '2025-03-15'] });
  });
});

// ── 2.5.3 — no implicit year constraint ───────────────────────────────────

describe('applyApplicationFilters — no year constraint (2.5.3)', () => {
  it('adds no date filter when no date params are provided', () => {
    const spy = createQuerySpy();
    applyApplicationFilters(spy, {});
    const dateCalls = spy.calls.filter(c => c.args[0] === 'applied_date');
    expect(dateCalls).toHaveLength(0);
  });

  it('adds no date filter when only non-date params are present', () => {
    const spy = createQuerySpy();
    applyApplicationFilters(spy, { status: 'applied', search: 'google' });
    const dateCalls = spy.calls.filter(c => c.args[0] === 'applied_date');
    expect(dateCalls).toHaveLength(0);
  });

  it('never adds an implicit year constraint — only caller-supplied bounds appear', () => {
    const spy = createQuerySpy();
    applyApplicationFilters(spy, { application_type: 'cold_strategic' });
    const dateConstraints = spy.calls.filter(
      c => (c.method === 'gte' || c.method === 'lte') && c.args[0] === 'applied_date',
    );
    expect(dateConstraints).toHaveLength(0);
  });
});
