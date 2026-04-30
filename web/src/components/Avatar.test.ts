import { describe, it, expect } from 'vitest';
import { getInitials } from './Avatar';

describe('Avatar initials', () => {
  it('uses first and last initial for a full name', () => {
    expect(getInitials('Teial Dickens')).toBe('TD');
  });

  it('uses first two chars for a single name', () => {
    expect(getInitials('Jordan')).toBe('JO');
  });

  it('uses first and last word when more than two names given', () => {
    expect(getInitials('Mary Jane Watson')).toBe('MW');
  });
});
