import { describe, expect, it } from 'vitest';
import { shouldWarnBeforeClosing } from './ApplicationModal';

describe('shouldWarnBeforeClosing', () => {
  it('allows closing when the form and interview editor have no unsaved work', () => {
    expect(shouldWarnBeforeClosing({
      isDirty: false,
      isInterviewEditorOpen: false,
    })).toBe(false);
  });

  it('warns when the application form has unsaved changes', () => {
    expect(shouldWarnBeforeClosing({
      isDirty: true,
      isInterviewEditorOpen: false,
    })).toBe(true);
  });

  it('warns when the interview editor is open', () => {
    expect(shouldWarnBeforeClosing({
      isDirty: false,
      isInterviewEditorOpen: true,
    })).toBe(true);
  });
});
