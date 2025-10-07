/**
 * Accessibility Utilities
 * Provides helper functions for WCAG compliance
 */

/**
 * Generate accessible aria-label for buttons without text
 */
export function getAriaLabel(action: string, target?: string): string {
  return target ? `${action} ${target}` : action
}

/**
 * Check if color contrast meets WCAG AA standards (4.5:1 for normal text, 3:1 for large text)
 */
export function meetsContrastRatio(
  foreground: string,
  background: string,
  isLargeText: boolean = false
): boolean {
  const ratio = getContrastRatio(foreground, background)
  const minRatio = isLargeText ? 3 : 4.5
  return ratio >= minRatio
}

/**
 * Calculate contrast ratio between two colors
 */
function getContrastRatio(color1: string, color2: string): number {
  const l1 = getRelativeLuminance(color1)
  const l2 = getRelativeLuminance(color2)
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return (lighter + 0.05) / (darker + 0.05)
}

/**
 * Get relative luminance of a color
 */
function getRelativeLuminance(color: string): number {
  // Convert hex to RGB
  const hex = color.replace('#', '')
  const r = parseInt(hex.substr(0, 2), 16) / 255
  const g = parseInt(hex.substr(2, 2), 16) / 255
  const b = parseInt(hex.substr(4, 2), 16) / 255

  // Calculate relative luminance
  const [rs, gs, bs] = [r, g, b].map(c => {
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  })

  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
}

/**
 * Generate unique ID for form elements
 */
export function generateId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Focus trap for modals and dialogs
 */
export function setupFocusTrap(container: HTMLElement): () => void {
  const focusableElements = container.querySelectorAll<HTMLElement>(
    'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
  )

  const firstElement = focusableElements[0]
  const lastElement = focusableElements[focusableElements.length - 1]

  const handleTabKey = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return

    if (e.shiftKey) {
      if (document.activeElement === firstElement) {
        lastElement?.focus()
        e.preventDefault()
      }
    } else {
      if (document.activeElement === lastElement) {
        firstElement?.focus()
        e.preventDefault()
      }
    }
  }

  const handleEscapeKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      const closeButton = container.querySelector<HTMLElement>('[data-close-modal]')
      closeButton?.click()
    }
  }

  container.addEventListener('keydown', handleTabKey)
  container.addEventListener('keydown', handleEscapeKey)

  // Focus first element
  firstElement?.focus()

  // Cleanup
  return () => {
    container.removeEventListener('keydown', handleTabKey)
    container.removeEventListener('keydown', handleEscapeKey)
  }
}

/**
 * Announce to screen readers
 */
export function announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
  const announcer = document.getElementById('sr-announcer')
  if (announcer) {
    announcer.setAttribute('aria-live', priority)
    announcer.textContent = message
    // Clear after announcement
    setTimeout(() => {
      announcer.textContent = ''
    }, 1000)
  }
}

/**
 * Check if element is keyboard accessible
 */
export function isKeyboardAccessible(element: HTMLElement): boolean {
  const tabIndex = element.getAttribute('tabindex')
  return (
    element.tagName === 'A' ||
    element.tagName === 'BUTTON' ||
    element.tagName === 'INPUT' ||
    element.tagName === 'SELECT' ||
    element.tagName === 'TEXTAREA' ||
    (tabIndex !== null && parseInt(tabIndex) >= 0)
  )
}
