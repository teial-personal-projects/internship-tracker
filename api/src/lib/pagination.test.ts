import { describe, expect, it } from 'vitest';
import { computePageRange, computeTotalPages } from './pagination';

describe('computePageRange', () => {
  it('page 1 with limit=25 covers exactly 25 rows (indices 0–24)', () => {
    const { from, to } = computePageRange(1, 25);
    expect(from).toBe(0);
    expect(to).toBe(24);
    expect(to - from + 1).toBe(25);
  });

  it('page 2 with limit=25 starts at index 25', () => {
    const { from, to } = computePageRange(2, 25);
    expect(from).toBe(25);
    expect(to).toBe(49);
  });

  it('page 3 with limit=10 starts at index 20', () => {
    const { from } = computePageRange(3, 10);
    expect(from).toBe(20);
  });
});

describe('computeTotalPages', () => {
  it('26 records with limit=25 gives totalPages=2', () => {
    expect(computeTotalPages(26, 25)).toBe(2);
  });

  it('25 records with limit=25 gives totalPages=1', () => {
    expect(computeTotalPages(25, 25)).toBe(1);
  });

  it('0 records gives totalPages=1 (never 0)', () => {
    expect(computeTotalPages(0, 25)).toBe(1);
  });

  it('exact multiple: 50 records with limit=25 gives totalPages=2', () => {
    expect(computeTotalPages(50, 25)).toBe(2);
  });

  it('51 records with limit=25 gives totalPages=3', () => {
    expect(computeTotalPages(51, 25)).toBe(3);
  });
});
