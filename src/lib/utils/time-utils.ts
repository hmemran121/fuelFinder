/**
 * Time utilities for Dhaka-specific logistics (UTC+6)
 */

/**
 * Returns the most recent 12:00:00 AM in Dhaka Timezone.
 * This is used as the reference point for resetting stale pump data.
 */
/**
 * Returns the UTC Date representing the start of the current day in Dhaka (UTC+6).
 */
export function getDhakaMidnight(): Date {
  const now = new Date();
  
  // Convert current UTC time to Dhaka time by adding 6 hours
  const dhakaNow = new Date(now.getTime() + (6 * 60 * 60 * 1000));
  
  // Reset time to 00:00:00 within the Dhaka "day"
  dhakaNow.setUTCHours(0, 0, 0, 0);
  
  // Convert back to UTC to return the actual reference point
  return new Date(dhakaNow.getTime() - (6 * 60 * 60 * 1000));
}

/**
 * Checks if a given timestamp is "stale" (i.e., from a previous day cycle in Dhaka).
 * @param lastUpdated The Firestore timestamp or Date to check
 */
export function isStale(lastUpdated: any): boolean {
  if (!lastUpdated) return true;
  
  let updatedDate: Date;
  
  // Handle Firestore Timestamp specifically
  if (lastUpdated && typeof lastUpdated.toDate === 'function') {
    updatedDate = lastUpdated.toDate();
  } else if (lastUpdated instanceof Date) {
    updatedDate = lastUpdated;
  } else {
    updatedDate = new Date(lastUpdated);
  }

  const resetPoint = getDhakaMidnight();
  
  // If lastUpdated is BEFORE today's midnight in Dhaka, it's stale
  return updatedDate < resetPoint;
}

/**
 * Calculates user level based on contribution count
 */
export function calculateUserLevel(count: number): number {
  // Logic: Level 1 every 10 points
  return Math.floor(count / 10) + 1;
}
