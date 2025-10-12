'use client'

import { Check, Clock, AlertCircle, Loader2 } from 'lucide-react'
import { cn } from '@/src/lib/utils'
import { formatDistanceToNow } from 'date-fns'

interface SaveStatusProps {
  isSaving: boolean
  lastSaved: Date | null
  error: string | null
  isDirty: boolean
  className?: string
}

export function SaveStatus({ isSaving, lastSaved, error, isDirty, className }: SaveStatusProps) {
  if (error) {
    return (
      <div className={cn('flex items-center gap-2 text-sm text-destructive', className)}>
        <AlertCircle className="h-4 w-4" />
        <span>Save failed</span>
      </div>
    )
  }

  if (isSaving) {
    return (
      <div className={cn('flex items-center gap-2 text-sm text-muted-foreground', className)}>
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Saving...</span>
      </div>
    )
  }

  if (isDirty) {
    return (
      <div className={cn('flex items-center gap-2 text-sm text-muted-foreground', className)}>
        <Clock className="h-4 w-4" />
        <span>Unsaved changes</span>
      </div>
    )
  }

  if (lastSaved) {
    return (
      <div className={cn('flex items-center gap-2 text-sm text-muted-foreground', className)}>
        <Check className="h-4 w-4 text-green-500" />
        <span>Saved {formatDistanceToNow(lastSaved, { addSuffix: true })}</span>
      </div>
    )
  }

  return null
}
