// Collaborators List Component
'use client'

import Image from 'next/image'
import { Users } from 'lucide-react'
import type { CollaboratorPresence } from '@/src/lib/collaboration/types'

interface CollaboratorsListProps {
  collaborators: CollaboratorPresence[]
  isConnected: boolean
}

export function CollaboratorsList({ collaborators, isConnected }: CollaboratorsListProps) {
  if (!isConnected) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <div className="h-2 w-2 rounded-full bg-gray-400" />
        <span>Disconnected</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
        <span>Connected</span>
      </div>

      {collaborators.length > 0 && (
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-gray-500" />
          <div className="flex -space-x-2">
            {collaborators.map(collab => (
              <div key={collab.userId} className="relative group" title={collab.name}>
                {collab.avatarUrl ? (
                  <Image
                    src={collab.avatarUrl}
                    alt={collab.name}
                    width={32}
                    height={32}
                    className="h-8 w-8 rounded-full ring-2 ring-white"
                  />
                ) : (
                  <div
                    className="h-8 w-8 rounded-full ring-2 ring-white flex items-center justify-center text-white text-xs font-medium"
                    style={{ backgroundColor: collab.color }}
                  >
                    {collab.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-white" />
              </div>
            ))}
          </div>
          <span className="text-sm text-gray-600">{collaborators.length}</span>
        </div>
      )}
    </div>
  )
}
