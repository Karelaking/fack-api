/**
 * Formats a Date object into a human-readable relative time string.
 * Used in the dashboard to display "last modified" timestamps.
 *
 * Output examples:
 * - "just now" (< 60 seconds)
 * - "5m ago" (< 60 minutes)
 * - "3h ago" (< 24 hours)
 * - "2d ago" (< 7 days)
 * - "Jun 15" (same year)
 * - "Jun 15, 2024" (different year)
 *
 * @param date - The Date object to format
 * @returns A human-readable relative time string
 */
export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) return "just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}
