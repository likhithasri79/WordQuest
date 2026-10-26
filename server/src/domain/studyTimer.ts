export const BASE_STUDY_INTERVAL_MINUTES = 15;

/**
 * Calculates progressive study duration in minutes based on total mismatches.
 * Formula: studyDurationMinutes = 15 * mismatchCount
 *
 * Mismatch 1 -> 15 min
 * Mismatch 2 -> 30 min
 * Mismatch 3 -> 45 min
 * Mismatch 4 -> 60 min
 */
export function calculateStudyDurationMinutes(mismatchCount: number): number {
  if (mismatchCount <= 0) return 0;
  return BASE_STUDY_INTERVAL_MINUTES * mismatchCount;
}

/**
 * Calculates authoritative UTC expiration timestamp for a study session.
 */
export function calculateStudyEndsAt(mismatchCount: number, baseTime: Date = new Date()): Date {
  const durationMinutes = calculateStudyDurationMinutes(mismatchCount);
  const durationMs = durationMinutes * 60 * 1000;
  return new Date(baseTime.getTime() + durationMs);
}

/**
 * Validates whether an authoritative study period has expired.
 * A null deadline implies no study period is active (open for submission).
 */
export function isStudyPeriodExpired(
  studyEndsAt: Date | null,
  currentTime: Date = new Date()
): boolean {
  if (!studyEndsAt) return true;
  return currentTime.getTime() >= studyEndsAt.getTime();
}

/**
 * Calculates remaining seconds in the active study session.
 * Returns 0 if expired or inactive.
 */
export function getRemainingStudySeconds(
  studyEndsAt: Date | null,
  currentTime: Date = new Date()
): number {
  if (!studyEndsAt) return 0;
  const remainingMs = studyEndsAt.getTime() - currentTime.getTime();
  return Math.max(0, Math.ceil(remainingMs / 1000));
}
