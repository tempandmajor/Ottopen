'use client'

import { AlertTriangle, Info, Sparkles } from 'lucide-react'
import { Alert, AlertDescription } from '@/src/components/ui/alert'
import { cn } from '@/src/lib/utils'

interface AIDisclaimerProps {
  variant?: 'default' | 'compact' | 'inline'
  className?: string
}

export function AIDisclaimer({ variant = 'default', className }: AIDisclaimerProps) {
  if (variant === 'compact') {
    return (
      <Alert className={cn('border-amber-200 bg-amber-50 dark:bg-amber-950/20', className)}>
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-xs text-amber-800 dark:text-amber-200">
          <strong>AI-Generated Content:</strong> Please review and verify all AI suggestions. AI may
          make mistakes or generate inaccurate information.
        </AlertDescription>
      </Alert>
    )
  }

  if (variant === 'inline') {
    return (
      <div className={cn('flex items-start gap-2 text-xs text-muted-foreground', className)}>
        <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
        <p>
          AI suggestions should be reviewed and verified. Content may contain errors or
          inaccuracies.
        </p>
      </div>
    )
  }

  return (
    <Alert className={cn('border-blue-200 bg-blue-50 dark:bg-blue-950/20', className)}>
      <Sparkles className="h-4 w-4 text-blue-600" />
      <AlertDescription className="text-sm space-y-2">
        <p className="font-semibold text-blue-900 dark:text-blue-100">
          Important: AI-Generated Content Notice
        </p>
        <ul className="list-disc list-inside text-blue-800 dark:text-blue-200 space-y-1">
          <li>
            <strong>Review Required:</strong> AI suggestions are provided as assistance only and
            should always be reviewed for accuracy, appropriateness, and originality.
          </li>
          <li>
            <strong>May Contain Errors:</strong> AI can make mistakes, generate inaccurate
            information, or produce content that may not be suitable for your needs.
          </li>
          <li>
            <strong>You&apos;re Responsible:</strong> You retain full ownership and responsibility
            for your final work, including any AI-assisted content.
          </li>
          <li>
            <strong>Fact-Check:</strong> Always verify factual information, especially for research,
            historical references, and technical details.
          </li>
          <li>
            <strong>Original Work:</strong> AI-generated content should be edited and adapted to
            maintain your unique voice and creative vision.
          </li>
        </ul>
        <p className="text-xs text-blue-700 dark:text-blue-300 mt-3">
          By using AI features, you acknowledge and accept these terms. See our{' '}
          <a href="/legal/terms" className="underline hover:text-blue-900" target="_blank">
            Terms of Service
          </a>{' '}
          for more information.
        </p>
      </AlertDescription>
    </Alert>
  )
}
