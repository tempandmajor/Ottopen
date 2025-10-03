'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ScriptList } from '@/src/components/script-editor/script-list'
import type { Script, ScriptType } from '@/src/types/script-editor'

export default function ScriptsPage() {
  const router = useRouter()
  const [scripts, setScripts] = useState<Script[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchScripts()
  }, [])

  const fetchScripts = async () => {
    try {
      const response = await fetch('/api/scripts')
      if (response.ok) {
        const data = await response.json()
        setScripts(data.scripts)
      }
    } catch (error) {
      console.error('Failed to fetch scripts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateScript = async (data: { title: string; script_type: ScriptType }) => {
    try {
      const response = await fetch('/api/scripts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        const { script } = await response.json()
        router.push(`/scripts/${script.id}`)
      }
    } catch (error) {
      console.error('Failed to create script:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading scripts...</p>
        </div>
      </div>
    )
  }

  return <ScriptList scripts={scripts} onCreateScript={handleCreateScript} />
}
