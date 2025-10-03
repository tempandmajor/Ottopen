'use client'

import { useState } from 'react'
import { Plus, Trash2, Edit2, Link as LinkIcon } from 'lucide-react'
import { Button } from '@/src/components/ui/button'
import { Input } from '@/src/components/ui/input'
import { Textarea } from '@/src/components/ui/textarea'
import { ScrollArea } from '@/src/components/ui/scroll-area'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/src/components/ui/dialog'
import { Label } from '@/src/components/ui/label'

interface CanvasNode {
  id: string
  type: 'idea' | 'character' | 'location' | 'plot' | 'theme' | 'note'
  title: string
  content: string
  x: number
  y: number
  color?: string
}

interface CanvasConnection {
  id: string
  from: string
  to: string
  label?: string
}

export function StoryCanvas({ manuscriptId }: { manuscriptId: string }) {
  const [nodes, setNodes] = useState<CanvasNode[]>([])
  const [connections, setConnections] = useState<CanvasConnection[]>([])
  const [selectedNode, setSelectedNode] = useState<CanvasNode | null>(null)
  const [isAddingNode, setIsAddingNode] = useState(false)

  const nodeColors = {
    idea: 'bg-gray-100 border-gray-400',
    character: 'bg-gray-100 border-gray-400',
    location: 'bg-gray-100 border-gray-400',
    plot: 'bg-gray-100 border-gray-400',
    theme: 'bg-gray-100 border-gray-400',
    note: 'bg-gray-100 border-gray-300',
  }

  const addNode = (type: CanvasNode['type']) => {
    const newNode: CanvasNode = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      title: `New ${type}`,
      content: '',
      x: Math.random() * 400,
      y: Math.random() * 400,
    }
    setNodes([...nodes, newNode])
    setIsAddingNode(false)
  }

  const updateNode = (id: string, updates: Partial<CanvasNode>) => {
    setNodes(nodes.map(node => (node.id === id ? { ...node, ...updates } : node)))
  }

  const deleteNode = (id: string) => {
    setNodes(nodes.filter(node => node.id !== id))
    setConnections(connections.filter(conn => conn.from !== id && conn.to !== id))
    setSelectedNode(null)
  }

  return (
    <div className="flex h-full">
      {/* Canvas Area */}
      <div className="flex-1 bg-gray-50 relative overflow-auto">
        <div className="min-w-[1000px] min-h-[1000px] relative">
          {nodes.map(node => (
            <div
              key={node.id}
              className={`absolute p-3 border-2 rounded-lg cursor-move shadow-sm hover:shadow-md transition-shadow ${nodeColors[node.type]}`}
              style={{ left: node.x, top: node.y, minWidth: '200px' }}
              onClick={() => setSelectedNode(node)}
            >
              <div className="font-semibold text-sm mb-1">{node.title}</div>
              <div className="text-xs text-gray-600 line-clamp-3">{node.content}</div>
            </div>
          ))}
        </div>

        {/* Add Node FAB */}
        <Dialog open={isAddingNode} onOpenChange={setIsAddingNode}>
          <DialogTrigger asChild>
            <Button className="fixed bottom-6 right-6 rounded-full h-14 w-14 shadow-lg" size="icon">
              <Plus className="h-6 w-6" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add to Canvas</DialogTitle>
              <DialogDescription>Choose what type of element to add</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="h-20 flex flex-col gap-2"
                onClick={() => addNode('idea')}
              >
                <div className="text-lg">💡</div>
                <div>Idea</div>
              </Button>
              <Button
                variant="outline"
                className="h-20 flex flex-col gap-2"
                onClick={() => addNode('character')}
              >
                <div className="text-lg">👤</div>
                <div>Character</div>
              </Button>
              <Button
                variant="outline"
                className="h-20 flex flex-col gap-2"
                onClick={() => addNode('location')}
              >
                <div className="text-lg">📍</div>
                <div>Location</div>
              </Button>
              <Button
                variant="outline"
                className="h-20 flex flex-col gap-2"
                onClick={() => addNode('plot')}
              >
                <div className="text-lg">📖</div>
                <div>Plot Point</div>
              </Button>
              <Button
                variant="outline"
                className="h-20 flex flex-col gap-2"
                onClick={() => addNode('theme')}
              >
                <div className="text-lg">🎭</div>
                <div>Theme</div>
              </Button>
              <Button
                variant="outline"
                className="h-20 flex flex-col gap-2"
                onClick={() => addNode('note')}
              >
                <div className="text-lg">📝</div>
                <div>Note</div>
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Details Panel */}
      {selectedNode && (
        <div className="w-96 border-l bg-white p-6">
          <ScrollArea className="h-full">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">Edit Node</h3>
                <Button variant="ghost" size="icon" onClick={() => deleteNode(selectedNode.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div>
                <Label>Title</Label>
                <Input
                  value={selectedNode.title}
                  onChange={e => updateNode(selectedNode.id, { title: e.target.value })}
                />
              </div>

              <div>
                <Label>Content</Label>
                <Textarea
                  value={selectedNode.content}
                  onChange={e => updateNode(selectedNode.id, { content: e.target.value })}
                  rows={10}
                />
              </div>

              <div>
                <Label>Type</Label>
                <div className="text-sm capitalize mt-1 p-2 bg-gray-50 rounded">
                  {selectedNode.type}
                </div>
              </div>

              <Button className="w-full" onClick={() => setSelectedNode(null)}>
                Done
              </Button>
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  )
}
