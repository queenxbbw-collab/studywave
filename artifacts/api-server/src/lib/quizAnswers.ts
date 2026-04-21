/**
 * Server-side quiz answer keys.
 * Keys are String(cls.grade) — "1" through "8".
 * Values are arrays of correct answer indices (0-based) in question order.
 */
export const QUIZ_ANSWERS: Record<string, number[]> = {
  "1": [2, 3, 1, 2, 2, 1, 2, 1, 2, 1, 1, 2, 3, 1],
  "2": [1, 1, 1, 1, 2, 1, 2, 1, 0, 1, 0, 2, 1],
  "3": [1, 2, 2, 1, 1, 1, 2, 0, 1, 2, 2, 1, 2, 2],
  "4": [1, 2, 1, 2, 1, 1, 2, 1, 0, 2, 1, 2, 1],
  "5": [1, 1, 1, 1, 1, 2, 2, 2, 1, 1, 2, 2],
  "6": [1, 1, 0, 1, 1, 2, 2, 1, 1, 1, 1, 2],
  "7": [1, 1, 1, 2, 2, 0, 1, 2, 3, 1, 2, 2],
  "8": [1, 1, 1, 1, 0, 2, 1, 1, 2, 1, 2, 1, 1],
};

export const QUIZ_TOTALS: Record<string, number> = {
  "1": 14,
  "2": 13,
  "3": 14,
  "4": 13,
  "5": 12,
  "6": 12,
  "7": 12,
  "8": 13,
};
