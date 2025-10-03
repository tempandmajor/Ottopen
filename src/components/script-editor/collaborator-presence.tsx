'use client'

import { useEffect, useState } from 'react'
import { Users } from 'lucide-react'
import type { CollaboratorPresence } from '@/src/lib/realtime-collaboration'

interface CollaboratorPresenceProps {
  presences: Record<string, CollaboratorPresence>
}

export function CollaboratorPresenceIndicator({ presences }: CollaboratorPresenceProps) {
  const collaborators = Object.values(presences)
  const [expanded, setExpanded] = useState(false)

  if (collaborators.length === 0) {
    return null
  }

  return (
    <div className="relative">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
      >
        <Users className="w-4 h-4 text-gray-600" />
        <span className="text-sm font-medium text-gray-700">{collaborators.length}</span>
        <div className="flex -space-x-2">
          {collaborators.slice(0, 3).map(collab => (
            <div
              key={collab.userId}
              className="w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-xs font-semibold text-white"
              style={{ backgroundColor: collab.color }}
              title={collab.userName}
            >
              {collab.userName.charAt(0).toUpperCase()}
            </div>
          ))}
          {collaborators.length > 3 && (
            <div className="w-6 h-6 rounded-full border-2 border-white bg-gray-400 flex items-center justify-center text-xs font-semibold text-white">
              +{collaborators.length - 3}
            </div>
          )}
        </div>
      </button>

      {expanded && (
        <div className="absolute top-full mt-2 right-0 bg-white border border-gray-200 rounded-lg shadow-lg p-3 min-w-[250px] z-50">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Active Collaborators</h3>
          <div className="space-y-2">
            {collaborators.map(collab => {
              const timeSinceActive = Date.now() - collab.lastActive
              const isActive = timeSinceActive < 10000 // Active if updated in last 10 seconds

              return (
                <div key={collab.userId} className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold text-white"
                    style={{ backgroundColor: collab.color }}
                  >
                    {collab.userName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">{collab.userName}</div>
                    <div className="text-xs text-gray-500">{collab.userEmail}</div>
                  </div>
                  <div
                    className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-500' : 'bg-gray-300'}`}
                    title={isActive ? 'Active' : 'Idle'}
                  />
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

interface CollaboratorCursorProps {
  presence: CollaboratorPresence
  elementId: string
}

export function CollaboratorCursor({ presence, elementId }: CollaboratorCursorProps) {
  if (!presence.cursor || presence.cursor.elementId !== elementId) {
    return null
  }

  return (
    <div
      className="absolute h-5 w-0.5 animate-pulse"
      style={{
        backgroundColor: presence.color,
        left: `${presence.cursor.position}px`,
      }}
    >
      <div
        className="absolute -top-5 left-0 px-1.5 py-0.5 rounded text-xs font-medium text-white whitespace-nowrap"
        style={{ backgroundColor: presence.color }}
      >
        {presence.userName}
      </div>
    </div>
  )
}
