import { usePathname } from 'next/navigation'
import type { NavigationContext } from '@/src/types/navigation'

/**
 * Hook to determine the current navigation context based on the route
 * This enables context-aware sidebar rendering
 *
 * @returns 'app' | 'ai-editor' | 'script-editor'
 */
export function useNavigationContext(): NavigationContext {
  const pathname = usePathname()

  // AI Editor context
  if (pathname === '/editor' || pathname?.startsWith('/editor/')) {
    return 'ai-editor'
  }

  // Script Editor context
  if (pathname?.startsWith('/scripts/') && !pathname.endsWith('/scripts')) {
    return 'script-editor'
  }

  // Default app context (dashboard, feed, search, etc.)
  return 'app'
}

/**
 * Hook to check if currently in any editor context
 */
export function useIsInEditor(): boolean {
  const context = useNavigationContext()
  return context === 'ai-editor' || context === 'script-editor'
}

/**
 * Hook to get the current editor type
 */
export function useEditorType(): 'ai-editor' | 'script-editor' | null {
  const context = useNavigationContext()
  return context === 'app' ? null : context
}
