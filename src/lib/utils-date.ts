import { Timestamp } from "firebase/firestore";

/**
 * Formats a Firestore Timestamp or Date object into a readable string.
 */
export function formatLastUpdated(timestamp: any): string {
  if (!timestamp) return "Never";

  // Handle Firestore Timestamp { seconds, nanoseconds }
  if (timestamp && typeof timestamp === 'object' && 'seconds' in timestamp) {
    try {
      const date = new Timestamp(timestamp.seconds, timestamp.nanoseconds).toDate();
      return formatRelativeTime(date);
    } catch (e) {
      console.error("Timestamp formatting error:", e);
      return "Recently";
    }
  }

  // Handle JS Date or string
  if (timestamp instanceof Date) {
    return formatRelativeTime(timestamp);
  }

  return String(timestamp);
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

  if (diffInMinutes < 1) return "Just now";
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  
  return date.toLocaleDateString();
}
