import DOMPurify from 'isomorphic-dompurify';

const TEXT_ONLY = { ALLOWED_TAGS: [] as string[], ALLOWED_ATTR: [] as string[] };

function sanitizeText(input: string | null | undefined): string | null {
  if (input == null || input === '') return null;
  const clean = DOMPurify.sanitize(input.trim(), TEXT_ONLY);
  return clean || null;
}

const TEXT_FIELDS = [
  'company',
  'title',
  'industry',
  'location',
  'conference',
  'pay',
  'notes',
];

export function sanitizeJobInput(data: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = { ...data };
  for (const field of TEXT_FIELDS) {
    if (typeof result[field] === 'string') {
      result[field] = sanitizeText(result[field] as string);
    }
  }
  return result;
}
