// Step IDs that are N/A per application type.
// Keys must match those used in the Checklist component (Phase 2.4).
// recruiter_assisted: steps 6–12 are skipped (cold-outreach steps don't apply)
// referral: steps 9–12 are skipped (double-down / follow-up steps don't apply)
const NA_STEPS: Partial<Record<string, string[]>> = {
  recruiter_assisted: ['step_6', 'step_7', 'step_8', 'step_9', 'step_10', 'step_11', 'step_12'],
  referral:           ['step_9', 'step_10', 'step_11', 'step_12'],
};

export function recalculateChecklist(
  currentState: Record<string, boolean>,
  newType: string | null,
): Record<string, boolean> {
  const naSteps = newType ? NA_STEPS[newType] : undefined;
  if (!naSteps) return currentState;
  const skip = new Set(naSteps);
  return Object.fromEntries(
    Object.entries(currentState).filter(([key]) => !skip.has(key)),
  );
}
