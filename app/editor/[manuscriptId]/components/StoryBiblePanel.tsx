'use client'

import { useState, useEffect } from 'react'
import { Character, Location, PlotThread } from '@/src/types/ai-editor'
import { CharacterService, LocationService, PlotThreadService } from '@/src/lib/ai-editor-service'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs'
import { Button } from '@/src/components/ui/button'
import { Input } from '@/src/components/ui/input'
import { Label } from '@/src/components/ui/label'
import { Textarea } from '@/src/components/ui/textarea'
import { ScrollArea } from '@/src/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/src/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/src/components/ui/dialog'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card'
import { User, MapPin, Network, Plus, Edit2, Trash2, Search } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { logger } from '@/src/lib/editor-logger'

interface StoryBiblePanelProps {
  manuscriptId: string
}

export function StoryBiblePanel({ manuscriptId }: StoryBiblePanelProps) {
  const [characters, setCharacters] = useState<Character[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [plotThreads, setPlotThreads] = useState<PlotThread[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  // Character dialog state
  const [isCharacterDialogOpen, setIsCharacterDialogOpen] = useState(false)
  const [editingCharacter, setEditingCharacter] = useState<Character | null>(null)
  const [characterForm, setCharacterForm] = useState({
    name: '',
    role: 'protagonist' as Character['role'],
    age: undefined as number | undefined,
    gender: '',
    appearance: '',
    personality_summary: '',
    formative_events: '',
    internal_goal: '',
    external_goal: '',
    fear: '',
  })

  // Location dialog state
  const [isLocationDialogOpen, setIsLocationDialogOpen] = useState(false)
  const [editingLocation, setEditingLocation] = useState<Location | null>(null)
  const [locationForm, setLocationForm] = useState({
    name: '',
    type: 'city' as Location['type'],
    description: '',
    atmosphere: '',
    significance: '',
  })

  // Plot thread dialog state
  const [isPlotDialogOpen, setIsPlotDialogOpen] = useState(false)
  const [editingPlotThread, setEditingPlotThread] = useState<PlotThread | null>(null)
  const [plotForm, setPlotForm] = useState({
    title: '',
    type: 'main-plot' as PlotThread['type'],
    description: '',
    status: 'active' as PlotThread['status'],
  })

  useEffect(() => {
    loadData()
  }, [manuscriptId])

  const loadData = async () => {
    try {
      setLoading(true)
      const [charactersData, locationsData, plotThreadsData] = await Promise.all([
        CharacterService.getByManuscriptId(manuscriptId),
        LocationService.getByManuscriptId(manuscriptId),
        PlotThreadService.getByManuscriptId(manuscriptId),
      ])
      setCharacters(charactersData)
      setLocations(locationsData)
      setPlotThreads(plotThreadsData)
    } catch (error) {
      logger.error('Failed to load story bible data', error as Error, { manuscriptId })
      logger.userError('Failed to load story bible')
    } finally {
      setLoading(false)
    }
  }

  // Character handlers
  const handleOpenCharacterDialog = (character?: Character) => {
    if (character) {
      setEditingCharacter(character)
      setCharacterForm({
        name: character.name,
        role: character.role,
        age: character.age,
        gender: character.gender || '',
        appearance: character.appearance || '',
        personality_summary: character.personality_summary || '',
        formative_events: character.formative_events || '',
        internal_goal: character.internal_goal || '',
        external_goal: character.external_goal || '',
        fear: character.fear || '',
      })
    } else {
      setEditingCharacter(null)
      setCharacterForm({
        name: '',
        role: 'protagonist',
        age: undefined,
        gender: '',
        appearance: '',
        personality_summary: '',
        formative_events: '',
        internal_goal: '',
        external_goal: '',
        fear: '',
      })
    }
    setIsCharacterDialogOpen(true)
  }

  const handleSaveCharacter = async () => {
    try {
      if (editingCharacter) {
        await CharacterService.update(editingCharacter.id, characterForm)
        setCharacters(
          characters.map(c => (c.id === editingCharacter.id ? { ...c, ...characterForm } : c))
        )
        toast.success('Character updated')
      } else {
        const newCharacter = await CharacterService.create(manuscriptId, characterForm)
        setCharacters([...characters, newCharacter])
        toast.success('Character created')
      }
      setIsCharacterDialogOpen(false)
    } catch (error) {
      logger.error('Failed to save character', error as Error, {
        manuscriptId,
        characterId: editingCharacter?.id,
      })
      logger.userError('Failed to save character')
    }
  }

  const handleDeleteCharacter = async (id: string) => {
    if (!confirm('Delete this character?')) return

    try {
      await CharacterService.delete(id)
      setCharacters(characters.filter(c => c.id !== id))
      toast.success('Character deleted')
    } catch (error) {
      logger.error('Failed to delete character', error as Error, { characterId: id })
      logger.userError('Failed to delete character')
    }
  }

  // Location handlers
  const handleOpenLocationDialog = (location?: Location) => {
    if (location) {
      setEditingLocation(location)
      setLocationForm({
        name: location.name,
        type: location.type,
        description: location.description || '',
        atmosphere: location.atmosphere || '',
        significance: location.significance || '',
      })
    } else {
      setEditingLocation(null)
      setLocationForm({
        name: '',
        type: 'city',
        description: '',
        atmosphere: '',
        significance: '',
      })
    }
    setIsLocationDialogOpen(true)
  }

  const handleSaveLocation = async () => {
    try {
      if (editingLocation) {
        await LocationService.update(editingLocation.id, locationForm)
        setLocations(
          locations.map(l => (l.id === editingLocation.id ? { ...l, ...locationForm } : l))
        )
        toast.success('Location updated')
      } else {
        const newLocation = await LocationService.create(manuscriptId, locationForm)
        setLocations([...locations, newLocation])
        toast.success('Location created')
      }
      setIsLocationDialogOpen(false)
    } catch (error) {
      logger.error('Failed to save location', error as Error, {
        manuscriptId,
        locationId: editingLocation?.id,
      })
      logger.userError('Failed to save location')
    }
  }

  const handleDeleteLocation = async (id: string) => {
    if (!confirm('Delete this location?')) return

    try {
      await LocationService.delete(id)
      setLocations(locations.filter(l => l.id !== id))
      toast.success('Location deleted')
    } catch (error) {
      logger.error('Failed to delete location', error as Error, { locationId: id })
      logger.userError('Failed to delete location')
    }
  }

  // Plot thread handlers
  const handleOpenPlotDialog = (plotThread?: PlotThread) => {
    if (plotThread) {
      setEditingPlotThread(plotThread)
      setPlotForm({
        title: plotThread.title,
        type: plotThread.type,
        description: plotThread.description || '',
        status: plotThread.status,
      })
    } else {
      setEditingPlotThread(null)
      setPlotForm({
        title: '',
        type: 'main-plot',
        description: '',
        status: 'active',
      })
    }
    setIsPlotDialogOpen(true)
  }

  const handleSavePlotThread = async () => {
    try {
      if (editingPlotThread) {
        await PlotThreadService.update(editingPlotThread.id, plotForm)
        setPlotThreads(
          plotThreads.map(p => (p.id === editingPlotThread.id ? { ...p, ...plotForm } : p))
        )
        toast.success('Plot thread updated')
      } else {
        const newPlotThread = await PlotThreadService.create(manuscriptId, plotForm)
        setPlotThreads([...plotThreads, newPlotThread])
        toast.success('Plot thread created')
      }
      setIsPlotDialogOpen(false)
    } catch (error) {
      logger.error('Failed to save plot thread', error as Error, {
        manuscriptId,
        plotThreadId: editingPlotThread?.id,
      })
      logger.userError('Failed to save plot thread')
    }
  }

  const handleDeletePlotThread = async (id: string) => {
    if (!confirm('Delete this plot thread?')) return

    try {
      await PlotThreadService.delete(id)
      setPlotThreads(plotThreads.filter(p => p.id !== id))
      toast.success('Plot thread deleted')
    } catch (error) {
      logger.error('Failed to delete plot thread', error as Error, { plotThreadId: id })
      logger.userError('Failed to delete plot thread')
    }
  }

  const filteredCharacters = characters.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  )
  const filteredLocations = locations.filter(l =>
    l.name.toLowerCase().includes(searchQuery.toLowerCase())
  )
  const filteredPlotThreads = plotThreads.filter(p =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-sm text-muted-foreground">Loading story bible...</div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <h2 className="text-xl font-semibold mb-3">Story Bible</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="characters" className="flex-1 flex flex-col">
        <TabsList className="w-full justify-start px-4">
          <TabsTrigger value="characters" className="gap-2">
            <User className="h-4 w-4" />
            Characters ({characters.length})
          </TabsTrigger>
          <TabsTrigger value="locations" className="gap-2">
            <MapPin className="h-4 w-4" />
            Locations ({locations.length})
          </TabsTrigger>
          <TabsTrigger value="plot-threads" className="gap-2">
            <Network className="h-4 w-4" />
            Plot Threads ({plotThreads.length})
          </TabsTrigger>
        </TabsList>

        <ScrollArea className="flex-1">
          {/* Characters Tab */}
          <TabsContent value="characters" className="p-4 space-y-4 m-0">
            <Button onClick={() => handleOpenCharacterDialog()} className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              Add Character
            </Button>

            {filteredCharacters.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground">
                No characters found
              </div>
            ) : (
              <div className="space-y-3">
                {filteredCharacters.map(character => (
                  <Card key={character.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-base">{character.name}</CardTitle>
                          <CardDescription className="capitalize">
                            {character.role}
                            {character.age && ` • ${character.age} years old`}
                          </CardDescription>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenCharacterDialog(character)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteCharacter(character.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    {(character.appearance || character.personality_summary) && (
                      <CardContent>
                        <p className="text-sm text-muted-foreground line-clamp-3">
                          {character.appearance || character.personality_summary}
                        </p>
                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Locations Tab */}
          <TabsContent value="locations" className="p-4 space-y-4 m-0">
            <Button onClick={() => handleOpenLocationDialog()} className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              Add Location
            </Button>

            {filteredLocations.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground">
                No locations found
              </div>
            ) : (
              <div className="space-y-3">
                {filteredLocations.map(location => (
                  <Card key={location.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-base">{location.name}</CardTitle>
                          <CardDescription className="capitalize">{location.type}</CardDescription>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenLocationDialog(location)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteLocation(location.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    {location.description && (
                      <CardContent>
                        <p className="text-sm text-muted-foreground line-clamp-3">
                          {location.description}
                        </p>
                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Plot Threads Tab */}
          <TabsContent value="plot-threads" className="p-4 space-y-4 m-0">
            <Button onClick={() => handleOpenPlotDialog()} className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              Add Plot Thread
            </Button>

            {filteredPlotThreads.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground">
                No plot threads found
              </div>
            ) : (
              <div className="space-y-3">
                {filteredPlotThreads.map(plotThread => (
                  <Card key={plotThread.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-base">{plotThread.title}</CardTitle>
                          <CardDescription className="capitalize">
                            {plotThread.type} • {plotThread.status}
                          </CardDescription>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenPlotDialog(plotThread)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeletePlotThread(plotThread.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    {plotThread.description && (
                      <CardContent>
                        <p className="text-sm text-muted-foreground line-clamp-3">
                          {plotThread.description}
                        </p>
                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </ScrollArea>
      </Tabs>

      {/* Character Dialog */}
      <Dialog open={isCharacterDialogOpen} onOpenChange={setIsCharacterDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingCharacter ? 'Edit Character' : 'New Character'}</DialogTitle>
            <DialogDescription>
              {editingCharacter
                ? 'Update character details'
                : 'Create a new character for your story'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="char-name">Name *</Label>
                <Input
                  id="char-name"
                  value={characterForm.name}
                  onChange={e => setCharacterForm({ ...characterForm, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="char-role">Role *</Label>
                <Select
                  value={characterForm.role}
                  onValueChange={(v: any) => setCharacterForm({ ...characterForm, role: v })}
                >
                  <SelectTrigger id="char-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="protagonist">Protagonist</SelectItem>
                    <SelectItem value="antagonist">Antagonist</SelectItem>
                    <SelectItem value="supporting">Supporting</SelectItem>
                    <SelectItem value="minor">Minor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="char-age">Age</Label>
                <Input
                  id="char-age"
                  type="number"
                  value={characterForm.age || ''}
                  onChange={e =>
                    setCharacterForm({
                      ...characterForm,
                      age: e.target.value ? parseInt(e.target.value) : undefined,
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="char-gender">Gender</Label>
                <Input
                  id="char-gender"
                  value={characterForm.gender}
                  onChange={e => setCharacterForm({ ...characterForm, gender: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="char-appearance">Appearance</Label>
              <Textarea
                id="char-appearance"
                value={characterForm.appearance}
                onChange={e => setCharacterForm({ ...characterForm, appearance: e.target.value })}
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="char-personality">Personality Summary</Label>
              <Textarea
                id="char-personality"
                value={characterForm.personality_summary}
                onChange={e =>
                  setCharacterForm({ ...characterForm, personality_summary: e.target.value })
                }
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="char-formative">Formative Events / Backstory</Label>
              <Textarea
                id="char-formative"
                value={characterForm.formative_events}
                onChange={e =>
                  setCharacterForm({ ...characterForm, formative_events: e.target.value })
                }
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="char-internal-goal">Internal Goal</Label>
                <Textarea
                  id="char-internal-goal"
                  value={characterForm.internal_goal}
                  onChange={e =>
                    setCharacterForm({ ...characterForm, internal_goal: e.target.value })
                  }
                  rows={2}
                />
              </div>
              <div>
                <Label htmlFor="char-external-goal">External Goal</Label>
                <Textarea
                  id="char-external-goal"
                  value={characterForm.external_goal}
                  onChange={e =>
                    setCharacterForm({ ...characterForm, external_goal: e.target.value })
                  }
                  rows={2}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="char-fear">Fear / Weakness</Label>
              <Textarea
                id="char-fear"
                value={characterForm.fear}
                onChange={e => setCharacterForm({ ...characterForm, fear: e.target.value })}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCharacterDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveCharacter} disabled={!characterForm.name}>
              {editingCharacter ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Location Dialog */}
      <Dialog open={isLocationDialogOpen} onOpenChange={setIsLocationDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingLocation ? 'Edit Location' : 'New Location'}</DialogTitle>
            <DialogDescription>
              {editingLocation ? 'Update location details' : 'Create a new location for your story'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="loc-name">Name *</Label>
                <Input
                  id="loc-name"
                  value={locationForm.name}
                  onChange={e => setLocationForm({ ...locationForm, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="loc-type">Type *</Label>
                <Select
                  value={locationForm.type}
                  onValueChange={(v: any) => setLocationForm({ ...locationForm, type: v })}
                >
                  <SelectTrigger id="loc-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="city">City</SelectItem>
                    <SelectItem value="building">Building</SelectItem>
                    <SelectItem value="natural">Natural</SelectItem>
                    <SelectItem value="fictional">Fictional</SelectItem>
                    <SelectItem value="room">Room</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="loc-description">Description</Label>
              <Textarea
                id="loc-description"
                value={locationForm.description}
                onChange={e => setLocationForm({ ...locationForm, description: e.target.value })}
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="loc-atmosphere">Atmosphere/Mood</Label>
              <Textarea
                id="loc-atmosphere"
                value={locationForm.atmosphere}
                onChange={e => setLocationForm({ ...locationForm, atmosphere: e.target.value })}
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="loc-significance">Story Significance</Label>
              <Textarea
                id="loc-significance"
                value={locationForm.significance}
                onChange={e => setLocationForm({ ...locationForm, significance: e.target.value })}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsLocationDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveLocation} disabled={!locationForm.name}>
              {editingLocation ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Plot Thread Dialog */}
      <Dialog open={isPlotDialogOpen} onOpenChange={setIsPlotDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingPlotThread ? 'Edit Plot Thread' : 'New Plot Thread'}</DialogTitle>
            <DialogDescription>
              {editingPlotThread
                ? 'Update plot thread details'
                : 'Create a new plot thread for your story'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="plot-title">Title *</Label>
              <Input
                id="plot-title"
                value={plotForm.title}
                onChange={e => setPlotForm({ ...plotForm, title: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="plot-type">Type *</Label>
                <Select
                  value={plotForm.type}
                  onValueChange={(v: any) => setPlotForm({ ...plotForm, type: v })}
                >
                  <SelectTrigger id="plot-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="main-plot">Main Plot</SelectItem>
                    <SelectItem value="subplot">Subplot</SelectItem>
                    <SelectItem value="character-arc">Character Arc</SelectItem>
                    <SelectItem value="theme">Theme</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="plot-status">Status *</Label>
                <Select
                  value={plotForm.status}
                  onValueChange={(v: any) => setPlotForm({ ...plotForm, status: v })}
                >
                  <SelectTrigger id="plot-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planned">Planned</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="plot-description">Description</Label>
              <Textarea
                id="plot-description"
                value={plotForm.description}
                onChange={e => setPlotForm({ ...plotForm, description: e.target.value })}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPlotDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSavePlotThread} disabled={!plotForm.title}>
              {editingPlotThread ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
