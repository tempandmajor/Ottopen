'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/src/components/ui/avatar'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/src/components/ui/tooltip'
import { cn } from '@/src/lib/utils'
import type { CollaboratorPresence } from '@/src/lib/collaboration-service'
import { Users } from 'lucide-react'

interface CollaboratorAvatarsProps {
  collaborators: Map<string, CollaboratorPresence>
  maxDisplay?: number
  className?: string
}

export function CollaboratorAvatars({
  collaborators,
  maxDisplay = 5,
  className,
}: CollaboratorAvatarsProps) {
  const collaboratorArray = Array.from(collaborators.values())
  const displayedCollaborators = collaboratorArray.slice(0, maxDisplay)
  const remainingCount = Math.max(0, collaboratorArray.length - maxDisplay)

  if (collaborators.size === 0) {
    return null
  }

  return (
    <TooltipProvider>
      <div className={cn('flex items-center -space-x-2', className)}>
        {displayedCollaborators.map(collaborator => (
          <Tooltip key={collaborator.userId}>
            <TooltipTrigger>
              <Avatar
                className="h-8 w-8 border-2 border-background"
                style={{ borderColor: collaborator.color }}
              >
                <AvatarImage src={collaborator.userAvatar} alt={collaborator.userName} />
                <AvatarFallback
                  style={{ backgroundColor: collaborator.color }}
                  className="text-white text-xs font-semibold"
                >
                  {collaborator.userName
                    .split(' ')
                    .map(n => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2)}
                </AvatarFallback>
              </Avatar>
            </TooltipTrigger>
            <TooltipContent>
              <p>{collaborator.userName}</p>
            </TooltipContent>
          </Tooltip>
        ))}

        {remainingCount > 0 && (
          <Tooltip>
            <TooltipTrigger>
              <Avatar className="h-8 w-8 border-2 border-background bg-muted">
                <AvatarFallback className="text-xs font-semibold">
                  <Users className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
            </TooltipTrigger>
            <TooltipContent>
              <p>+{remainingCount} more</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  )
}
