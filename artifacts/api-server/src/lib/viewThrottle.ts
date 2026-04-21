/**
 * In-memory view-count throttling.
 * A given (questionId, viewerKey) pair counts at most once per TTL window.
 * Prevents naive view inflation by refreshing the page repeatedly.
 *
 * Note: process-local. Sufficient for single-instance deployments.
 */

const TTL_MS = 30 * 60 * 1000; // 30 minutes
const MAX_ENTRIES = 50_000;

const seen = new Map<string, number>();

function gc(now: number) {
  if (seen.size < MAX_ENTRIES) return;
  for (const [k, ts] of seen) {
    if (now - ts > TTL_MS) seen.delete(k);
    if (seen.size < MAX_ENTRIES * 0.8) break;
  }
}

/**
 * Returns true if this view should be counted, false if it was seen recently.
 * @param questionId numeric question id
 * @param viewerKey user id (preferred) or IP address
 */
export function shouldCountView(questionId: number, viewerKey: string | number): boolean {
  const key = `${questionId}:${viewerKey}`;
  const now = Date.now();
  const last = seen.get(key);
  if (last !== undefined && now - last < TTL_MS) return false;
  seen.set(key, now);
  gc(now);
  return true;
}
