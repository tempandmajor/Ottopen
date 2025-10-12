'use client'

import { Button } from '@/src/components/ui/button'
import { cn } from '@/src/lib/utils'
import { Hash } from 'lucide-react'

interface Heading {
  text: string
  level: number
  id: string
}

interface TableOfContentsProps {
  headings: Heading[]
  onHeadingClick: (heading: Heading) => void
  className?: string
}

export function TableOfContents({ headings, onHeadingClick, className }: TableOfContentsProps) {
  if (headings.length === 0) {
    return (
      <div className={cn('p-4 text-sm text-muted-foreground text-center', className)}>
        <Hash className="h-8 w-8 mx-auto mb-2 opacity-30" />
        <p>No headings yet</p>
        <p className="text-xs mt-1">Add headings to see the table of contents</p>
      </div>
    )
  }

  return (
    <nav className={cn('p-4 space-y-1', className)} aria-label="Table of contents">
      <h3 className="text-sm font-semibold mb-3 text-foreground">Table of Contents</h3>
      <div className="space-y-1">
        {headings.map((heading, index) => (
          <Button
            key={`${heading.id}-${index}`}
            variant="ghost"
            size="sm"
            className={cn(
              'w-full justify-start text-left font-normal hover:bg-accent',
              heading.level === 1 && 'font-semibold',
              heading.level === 2 && 'pl-4 text-sm',
              heading.level === 3 && 'pl-8 text-xs'
            )}
            onClick={() => onHeadingClick(heading)}
          >
            <span className="truncate">{heading.text}</span>
          </Button>
        ))}
      </div>
    </nav>
  )
}
