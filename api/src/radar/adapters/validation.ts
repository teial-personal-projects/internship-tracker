import type { NormalizedPosting, PostingValidationInput, PostingValidationResult } from './types';

export async function validateByBoardFetch(
  posting: PostingValidationInput,
  fetchPostings: (boardToken: string) => Promise<NormalizedPosting[]>,
): Promise<PostingValidationResult> {
  try {
    const postings = await fetchPostings(posting.boardToken);
    return postings.some((candidate) => candidate.externalId === posting.externalId)
      ? { status: 'live', error: null }
      : { status: 'closed', error: null };
  } catch (error) {
    return {
      status: 'error',
      error: error instanceof Error ? error.message : 'Posting validation failed',
    };
  }
}
