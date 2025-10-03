// Script Service
// CRUD operations for scripts, elements, beats, etc.

import { supabase } from '@/src/lib/supabase'
import type {
  Script,
  ScriptElement,
  ScriptBeat,
  ScriptCharacter,
  ScriptLocation,
  ScriptScene,
  ScriptNote,
  ScriptRevision,
  ScriptCollaborator,
  ProductionReport,
  SceneBreakdown,
  CharacterBreakdown,
  LocationBreakdown,
  ScriptType,
  ElementType,
} from '@/src/types/script-editor'

// ============================================================================
// SCRIPT OPERATIONS
// ============================================================================

export class ScriptService {
  /**
   * Create a new script
   */
  static async create(userId: string, data: Partial<Script>): Promise<Script> {
    const { data: script, error } = await supabase
      .from('scripts')
      .insert({
        user_id: userId,
        title: data.title || 'Untitled Script',
        script_type: data.script_type || 'screenplay',
        format_standard: data.format_standard || 'us_industry',
        logline: data.logline,
        genre: data.genre || [],
        revision_color: 'white',
        revision_number: 1,
        status: 'draft',
      })
      .select()
      .single()

    if (error) throw error
    return script
  }

  /**
   * Get script by ID
   */
  static async getById(scriptId: string): Promise<Script | null> {
    const { data, error } = await supabase.from('scripts').select('*').eq('id', scriptId).single()

    if (error) return null
    return data
  }

  /**
   * Get all scripts for a user
   */
  static async getUserScripts(
    userId: string,
    filters?: { script_type?: ScriptType; status?: string }
  ): Promise<Script[]> {
    let query = supabase.from('scripts').select('*').eq('user_id', userId)

    if (filters?.script_type) {
      query = query.eq('script_type', filters.script_type)
    }

    if (filters?.status) {
      query = query.eq('status', filters.status)
    }

    const { data, error } = await query.order('updated_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  /**
   * Update script
   */
  static async update(scriptId: string, data: Partial<Script>): Promise<Script> {
    const { data: script, error } = await supabase
      .from('scripts')
      .update(data)
      .eq('id', scriptId)
      .select()
      .single()

    if (error) throw error
    return script
  }

  /**
   * Delete script
   */
  static async delete(scriptId: string): Promise<void> {
    const { error } = await supabase.from('scripts').delete().eq('id', scriptId)

    if (error) throw error
  }

  /**
   * Lock script for production
   */
  static async lockScript(scriptId: string): Promise<void> {
    await this.update(scriptId, { is_locked: true })
  }

  /**
   * Unlock script
   */
  static async unlockScript(scriptId: string): Promise<void> {
    await this.update(scriptId, { is_locked: false })
  }

  /**
   * Lock script (alias for lockScript, returns updated script)
   */
  static async lock(scriptId: string): Promise<Script> {
    return await this.update(scriptId, { is_locked: true })
  }

  /**
   * Unlock script (alias for unlockScript, returns updated script)
   */
  static async unlock(scriptId: string): Promise<Script> {
    return await this.update(scriptId, { is_locked: false })
  }
}

// ============================================================================
// ELEMENT OPERATIONS
// ============================================================================

export class ElementService {
  /**
   * Get all elements for a script
   */
  static async getByScriptId(scriptId: string): Promise<ScriptElement[]> {
    const { data, error } = await supabase
      .from('script_elements')
      .select('*')
      .eq('script_id', scriptId)
      .order('order_index', { ascending: true })

    if (error) throw error
    return data || []
  }

  /**
   * Update element
   */
  static async update(elementId: string, data: Partial<ScriptElement>): Promise<ScriptElement> {
    const { data: element, error } = await supabase
      .from('script_elements')
      .update(data)
      .eq('id', elementId)
      .select()
      .single()

    if (error) throw error
    return element
  }

  /**
   * Delete element
   */
  static async delete(elementId: string): Promise<void> {
    const { error } = await supabase.from('script_elements').delete().eq('id', elementId)

    if (error) throw error
  }

  /**
   * Reorder elements
   */
  static async reorder(scriptId: string, elementIds: string[]): Promise<void> {
    const updates = elementIds.map((id, index) =>
      supabase.from('script_elements').update({ order_index: index }).eq('id', id)
    )

    await Promise.all(updates)
  }

  /**
   * Bulk create elements (for import)
   */
  static async bulkCreate(
    scriptId: string,
    elements: Array<Partial<ScriptElement>>
  ): Promise<ScriptElement[]> {
    const { data, error } = await supabase
      .from('script_elements')
      .insert(
        elements.map((el, index) => ({
          script_id: scriptId,
          element_type: el.element_type,
          content: el.content,
          character_id: el.character_id,
          location_id: el.location_id,
          scene_number: el.scene_number,
          page_number: el.page_number || Math.floor(index / 55) + 1,
          order_index: el.order_index || index,
          metadata: el.metadata,
        }))
      )
      .select()

    if (error) throw error

    // Auto-populate characters and locations
    if (data && data.length > 0) {
      await CharacterService.populateFromElements(scriptId)
      await LocationService.populateFromElements(scriptId)
    }

    return data || []
  }

  /**
   * Create single element
   */
  static async create(scriptId: string, data: Partial<ScriptElement>): Promise<ScriptElement> {
    const { data: element, error } = await supabase
      .from('script_elements')
      .insert({
        script_id: scriptId,
        element_type: data.element_type,
        content: data.content,
        scene_number: data.scene_number,
        order_index: data.order_index || 0,
        metadata: data.metadata,
      })
      .select()
      .single()

    if (error) throw error

    // Auto-populate if character or scene heading
    if (element.element_type === 'character') {
      await CharacterService.populateFromElements(scriptId)
    } else if (element.element_type === 'scene_heading') {
      await LocationService.populateFromElements(scriptId)
    }

    return element
  }
}

// ============================================================================
// BEAT OPERATIONS
// ============================================================================

export class BeatService {
  /**
   * Create beat
   */
  static async create(scriptId: string, data: Partial<ScriptBeat>): Promise<ScriptBeat> {
    const { data: beat, error } = await supabase
      .from('script_beats')
      .insert({
        script_id: scriptId,
        title: data.title,
        description: data.description,
        beat_type: data.beat_type,
        page_reference: data.page_reference,
        color: data.color,
        order_index: data.order_index || 0,
      })
      .select()
      .single()

    if (error) throw error
    return beat
  }

  /**
   * Get beats for script
   */
  static async getByScriptId(scriptId: string): Promise<ScriptBeat[]> {
    const { data, error } = await supabase
      .from('script_beats')
      .select('*')
      .eq('script_id', scriptId)
      .order('order_index', { ascending: true })

    if (error) throw error
    return data || []
  }

  /**
   * Update beat
   */
  static async update(beatId: string, data: Partial<ScriptBeat>): Promise<ScriptBeat> {
    const { data: beat, error } = await supabase
      .from('script_beats')
      .update(data)
      .eq('id', beatId)
      .select()
      .single()

    if (error) throw error
    return beat
  }

  /**
   * Delete beat
   */
  static async delete(beatId: string): Promise<void> {
    const { error } = await supabase.from('script_beats').delete().eq('id', beatId)

    if (error) throw error
  }
}

// ============================================================================
// CHARACTER OPERATIONS
// ============================================================================

export class CharacterService {
  /**
   * Get characters for script
   */
  static async getByScriptId(scriptId: string): Promise<ScriptCharacter[]> {
    const { data, error } = await supabase
      .from('script_characters')
      .select('*')
      .eq('script_id', scriptId)
      .order('dialogue_count', { ascending: false })

    if (error) throw error
    return data || []
  }

  /**
   * Auto-populate characters from script elements
   */
  static async populateFromElements(scriptId: string): Promise<void> {
    // Get all character elements
    const { data: elements, error: elementsError } = await supabase
      .from('script_elements')
      .select('*')
      .eq('script_id', scriptId)
      .eq('element_type', 'character')

    if (elementsError || !elements) return

    // Extract unique character names
    const characterNames = [...new Set(elements.map(el => el.content.trim()))]

    // Get existing characters
    const { data: existingChars } = await supabase
      .from('script_characters')
      .select('name')
      .eq('script_id', scriptId)

    const existingNames = new Set(existingChars?.map(c => c.name) || [])

    // Insert new characters
    const newCharacters = characterNames
      .filter(name => !existingNames.has(name))
      .map(name => ({
        script_id: scriptId,
        name,
        dialogue_count: elements.filter(el => el.content.trim() === name).length,
      }))

    if (newCharacters.length > 0) {
      await supabase.from('script_characters').insert(newCharacters)
    }
  }

  /**
   * Create character
   */
  static async create(scriptId: string, data: Partial<ScriptCharacter>): Promise<ScriptCharacter> {
    const { data: character, error } = await supabase
      .from('script_characters')
      .insert({
        script_id: scriptId,
        name: data.name,
        description: data.description,
        importance: data.importance || 'minor',
      })
      .select()
      .single()

    if (error) throw error
    return character
  }
}

// ============================================================================
// LOCATION OPERATIONS
// ============================================================================

export class LocationService {
  /**
   * Get locations for script
   */
  static async getByScriptId(scriptId: string): Promise<ScriptLocation[]> {
    const { data, error } = await supabase
      .from('script_locations')
      .select('*')
      .eq('script_id', scriptId)
      .order('scene_count', { ascending: false })

    if (error) throw error
    return data || []
  }

  /**
   * Auto-populate locations from scene headings
   */
  static async populateFromElements(scriptId: string): Promise<void> {
    // Get all scene heading elements
    const { data: elements, error: elementsError } = await supabase
      .from('script_elements')
      .select('*')
      .eq('script_id', scriptId)
      .eq('element_type', 'scene_heading')

    if (elementsError || !elements) return

    // Extract locations from scene headings
    const locations = elements
      .map(el => {
        // Parse "INT. COFFEE SHOP - DAY" -> "COFFEE SHOP"
        const match = el.content.match(/^(INT|EXT|INT\/EXT|I\/E)\.\s+(.+?)\s+-\s+/i)
        if (match) {
          return {
            name: match[2].trim(),
            location_type: match[1].replace('I/E', 'INT/EXT') as 'INT' | 'EXT' | 'INT/EXT',
          }
        }
        return null
      })
      .filter(
        (loc): loc is { name: string; location_type: 'INT' | 'EXT' | 'INT/EXT' } => loc !== null
      )

    // Get unique locations
    const uniqueLocations = new Map<
      string,
      { name: string; location_type: 'INT' | 'EXT' | 'INT/EXT' }
    >()
    locations.forEach(loc => {
      if (!uniqueLocations.has(loc.name)) {
        uniqueLocations.set(loc.name, loc)
      }
    })

    // Get existing locations
    const { data: existingLocs } = await supabase
      .from('script_locations')
      .select('name')
      .eq('script_id', scriptId)

    const existingNames = new Set(existingLocs?.map(l => l.name) || [])

    // Insert new locations
    const newLocations = Array.from(uniqueLocations.values())
      .filter(loc => !existingNames.has(loc.name))
      .map(loc => ({
        script_id: scriptId,
        name: loc.name,
        location_type: loc.location_type,
        scene_count: locations.filter(l => l.name === loc.name).length,
      }))

    if (newLocations.length > 0) {
      await supabase.from('script_locations').insert(newLocations)
    }
  }

  /**
   * Create location
   */
  static async create(scriptId: string, data: Partial<ScriptLocation>): Promise<ScriptLocation> {
    const { data: location, error } = await supabase
      .from('script_locations')
      .insert({
        script_id: scriptId,
        name: data.name,
        location_type: data.location_type || 'INT',
        description: data.description,
      })
      .select()
      .single()

    if (error) throw error
    return location
  }
}

// ============================================================================
// SCENE OPERATIONS
// ============================================================================

export class SceneService {
  /**
   * Get scenes for script
   */
  static async getByScriptId(scriptId: string): Promise<ScriptScene[]> {
    const { data, error } = await supabase
      .from('script_scenes')
      .select('*')
      .eq('script_id', scriptId)
      .order('order_index', { ascending: true })

    if (error) throw error
    return data || []
  }

  /**
   * Auto-generate scenes from elements
   */
  static async generateFromElements(scriptId: string): Promise<ScriptScene[]> {
    const elements = await ElementService.getByScriptId(scriptId)

    const scenes: Array<Partial<ScriptScene>> = []
    let currentScene: Partial<ScriptScene> | null = null
    let orderIndex = 0

    elements.forEach((element, index) => {
      if (element.element_type === 'scene_heading') {
        // Save previous scene
        if (currentScene) {
          const scene = currentScene as Partial<ScriptScene> & {
            page_end?: number
            page_count?: number
            page_start?: number
          }
          scene.page_end = element.page_number
          scene.page_count = (scene.page_end || 0) - (scene.page_start || 0)
          scenes.push(scene)
        }

        // Start new scene
        currentScene = {
          script_id: scriptId,
          scene_number: element.scene_number || `${orderIndex + 1}`,
          location_type: element.metadata?.location_type,
          time_of_day: element.metadata?.time_of_day,
          description: element.content,
          page_start: element.page_number,
          order_index: orderIndex,
          is_omitted: false,
        }

        orderIndex++
      }
    })

    // Save last scene
    if (currentScene) {
      const scene = currentScene as Partial<ScriptScene> & {
        page_end?: number
        page_count?: number
        page_start?: number
      }
      scene.page_end = elements[elements.length - 1]?.page_number || 1
      scene.page_count = (scene.page_end || 0) - (scene.page_start || 0)
      scenes.push(scene)
    }

    // Delete existing scenes
    await supabase.from('script_scenes').delete().eq('script_id', scriptId)

    // Insert new scenes
    const { data, error } = await supabase
      .from('script_scenes')
      .insert(scenes as any)
      .select()

    if (error) throw error
    return data || []
  }
}

// ============================================================================
// PRODUCTION REPORTS
// ============================================================================

export class ProductionReportService {
  /**
   * Generate complete production report
   */
  static async generate(scriptId: string): Promise<ProductionReport> {
    const [script, scenes, elements] = await Promise.all([
      ScriptService.getById(scriptId),
      SceneService.getByScriptId(scriptId),
      ElementService.getByScriptId(scriptId),
    ])

    if (!script) throw new Error('Script not found')

    // Scene breakdown
    const sceneBreakdown: SceneBreakdown[] = scenes.map(scene => {
      const sceneElements = elements.filter(el => el.scene_number === scene.scene_number)
      const characters = [
        ...new Set(
          sceneElements.filter(el => el.element_type === 'character').map(el => el.content)
        ),
      ]

      return {
        scene_number: scene.scene_number,
        location: scene.description || '',
        location_type: scene.location_type || 'INT',
        time_of_day: scene.time_of_day || 'DAY',
        page_count: scene.page_count || 0,
        characters,
        description: scene.description || '',
      }
    })

    // Character breakdown
    const characterMap = new Map<string, CharacterBreakdown>()
    elements.forEach(el => {
      if (el.element_type === 'character') {
        const name = el.content
        if (!characterMap.has(name)) {
          characterMap.set(name, {
            name,
            character_type: 'minor',
            scene_count: 0,
            dialogue_count: 0,
            first_appearance: el.page_number,
            last_appearance: el.page_number,
            speaking_role: true,
          })
        }

        const char = characterMap.get(name)!
        char.last_appearance = Math.max(char.last_appearance, el.page_number)
        char.scene_count++
      }

      if (el.element_type === 'dialogue') {
        const prevChar = elements[elements.indexOf(el) - 1]
        if (prevChar && prevChar.element_type === 'character') {
          const char = characterMap.get(prevChar.content)
          if (char) char.dialogue_count++
        }
      }
    })

    // Classify characters by importance
    characterMap.forEach(char => {
      if (char.scene_count >= 20) char.character_type = 'lead'
      else if (char.scene_count >= 10) char.character_type = 'supporting'
      else if (char.scene_count >= 3) char.character_type = 'minor'
      else char.character_type = 'extra'
    })

    // Location breakdown
    const locationMap = new Map<string, LocationBreakdown>()
    scenes.forEach(scene => {
      const location = scene.description || 'UNKNOWN'
      if (!locationMap.has(location)) {
        locationMap.set(location, {
          name: location,
          location_type: scene.location_type || 'INT',
          scene_count: 0,
          page_count: 0,
          times_of_day: [],
          is_practical: true,
        })
      }

      const loc = locationMap.get(location)!
      loc.scene_count++
      loc.page_count += scene.page_count || 0
      if (scene.time_of_day && !loc.times_of_day.includes(scene.time_of_day)) {
        loc.times_of_day.push(scene.time_of_day)
      }
    })

    // Day/Night breakdown
    const dayNightBreakdown = {
      day: scenes.filter(s => s.time_of_day?.toUpperCase() === 'DAY').length,
      night: scenes.filter(s => s.time_of_day?.toUpperCase() === 'NIGHT').length,
      dawn: scenes.filter(s => s.time_of_day?.toUpperCase() === 'DAWN').length,
      dusk: scenes.filter(s => s.time_of_day?.toUpperCase() === 'DUSK').length,
      other:
        scenes.length -
        scenes.filter(s => ['DAY', 'NIGHT', 'DAWN', 'DUSK'].includes(s.time_of_day || '')).length,
    }

    // INT/EXT breakdown
    const intExtBreakdown = {
      interior: scenes.filter(s => s.location_type === 'INT').length,
      exterior: scenes.filter(s => s.location_type === 'EXT').length,
      both: scenes.filter(s => s.location_type === 'INT/EXT').length,
    }

    return {
      script_id: scriptId,
      title: script.title,
      total_pages: script.page_count,
      estimated_runtime: script.estimated_runtime || script.page_count,
      scenes: sceneBreakdown,
      characters: Array.from(characterMap.values()),
      locations: Array.from(locationMap.values()),
      dayNightBreakdown,
      intExtBreakdown,
    }
  }

  /**
   * Export production report as PDF
   */
  static async exportToPDF(scriptId: string): Promise<Blob> {
    // TODO: Implement PDF generation
    throw new Error('Not implemented')
  }
}

// ============================================================================
// COLLABORATION
// ============================================================================

export class CollaborationService {
  /**
   * Add collaborator
   */
  static async addCollaborator(
    scriptId: string,
    userId: string,
    invitedBy: string,
    role: string = 'writer'
  ): Promise<ScriptCollaborator> {
    const { data, error } = await supabase
      .from('script_collaborators')
      .insert({
        script_id: scriptId,
        user_id: userId,
        role,
        invited_by: invitedBy,
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  /**
   * Get collaborators
   */
  static async getCollaborators(scriptId: string): Promise<ScriptCollaborator[]> {
    const { data, error } = await supabase
      .from('script_collaborators')
      .select('*')
      .eq('script_id', scriptId)

    if (error) throw error
    return data || []
  }

  /**
   * Remove collaborator
   */
  static async removeCollaborator(scriptId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('script_collaborators')
      .delete()
      .eq('script_id', scriptId)
      .eq('user_id', userId)

    if (error) throw error
  }
}
