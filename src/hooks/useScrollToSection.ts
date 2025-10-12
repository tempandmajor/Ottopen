'use client'

import { useCallback, RefObject } from 'react'

interface UseScrollToSectionOptions {
  containerRef?: RefObject<HTMLElement>
  behavior?: ScrollBehavior
  block?: ScrollLogicalPosition
  offset?: number
}

export function useScrollToSection({
  containerRef,
  behavior = 'smooth',
  block = 'start',
  offset = 0,
}: UseScrollToSectionOptions = {}) {
  const scrollToSection = useCallback(
    (sectionId: string) => {
      // Find the element by ID or data attribute
      const element =
        document.getElementById(sectionId) ||
        document.querySelector(`[data-section-id="${sectionId}"]`)

      if (!element) {
        console.warn(`Section not found: ${sectionId}`)
        return
      }

      // If we have a container ref, scroll within that container
      if (containerRef?.current) {
        const container = containerRef.current
        const elementRect = element.getBoundingClientRect()
        const containerRect = container.getBoundingClientRect()

        // Calculate the scroll position relative to the container
        const scrollTop = element.offsetTop - containerRect.top - offset

        container.scrollTo({
          top: scrollTop,
          behavior,
        })
      } else {
        // Otherwise, scroll the whole page
        const top = element.getBoundingClientRect().top + window.pageYOffset - offset

        window.scrollTo({
          top,
          behavior,
        })
      }

      // Focus the element for accessibility
      element.focus({ preventScroll: true })
    },
    [containerRef, behavior, block, offset]
  )

  return { scrollToSection }
}
