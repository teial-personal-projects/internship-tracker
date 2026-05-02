import sanitizeHtml from 'sanitize-html';

const STRIP_ALL = { allowedTags: [] as string[], allowedAttributes: {} };

function sanitizeText(input: string | null | undefined): string | null {
  if (input == null || input === '') return null;
  const clean = sanitizeHtml(input, STRIP_ALL).trim();
  return clean || null;
}

const JOB_TEXT_FIELDS = [
  'company',
  'title',
  'industry',
  'location',
  'conference',
  'pay',
  'notes',
];

const APPLICATION_TEXT_FIELDS = [
  'company',
  'title',
  'industry',
  'location',
  'pay',
  'notes',
];

export function sanitizeJobInput(data: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = { ...data };
  for (const field of JOB_TEXT_FIELDS) {
    if (typeof result[field] === 'string') {
      result[field] = sanitizeText(result[field] as string);
    }
  }
  return result;
}

export function sanitizeApplicationInput(data: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = { ...data };
  for (const field of APPLICATION_TEXT_FIELDS) {
    if (typeof result[field] === 'string') {
      result[field] = sanitizeText(result[field] as string);
    }
  }
  return result;
}
