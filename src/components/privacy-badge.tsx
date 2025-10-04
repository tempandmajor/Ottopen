'use client'

import { Shield, Lock, Users, Eye } from 'lucide-react'
import { Badge } from '@/src/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/src/components/ui/tooltip'

interface PrivacyBadgeProps {
  visibility: 'public' | 'followers_only' | 'private'
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
}

export function PrivacyBadge({ visibility, size = 'md', showLabel = false }: PrivacyBadgeProps) {
  const icons = {
    public: Eye,
    followers_only: Users,
    private: Lock,
  }

  const labels = {
    public: 'Public',
    followers_only: 'Followers Only',
    private: 'Private',
  }

  const descriptions = {
    public: 'Visible to everyone',
    followers_only: 'Visible to followers only',
    private: 'Only visible to you',
  }

  const colors = {
    public: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
    followers_only: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
    private: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
  }

  const Icon = icons[visibility]
  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="secondary" className={`${colors[visibility]} cursor-help`}>
            <Icon className={`${iconSizes[size]} ${showLabel ? 'mr-1' : ''}`} />
            {showLabel && <span className="text-xs">{labels[visibility]}</span>}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-sm">{descriptions[visibility]}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
