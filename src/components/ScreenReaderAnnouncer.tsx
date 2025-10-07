/**
 * Screen Reader Announcer Component
 * Provides live region for screen reader announcements
 */

export function ScreenReaderAnnouncer() {
  return (
    <div
      id="sr-announcer"
      className="sr-only"
      role="status"
      aria-live="polite"
      aria-atomic="true"
    />
  )
}
