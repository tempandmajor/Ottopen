// Shared Research Repository Service
// Manage research notes that can be linked across multiple projects

import { supabase } from '@/src/lib/supabase'
import type { ResearchNote, ResearchLink } from '@/src/types/script-editor'

export class ResearchService {
  /**
   * Create a new research note
   */
  static async create(userId: string, data: Partial<ResearchNote>): Promise<ResearchNote> {
    const { data: note, error } = await supabase
      .from('research_notes')
      .insert({
        user_id: userId,
        title: data.title || 'Untitled Note',
        content: data.content || '',
        tags: data.tags || [],
        linked_scripts: data.linked_scripts || [],
        source_url: data.source_url,
        source_type: data.source_type,
      })
      .select()
      .single()

    if (error) throw error
    return note
  }

  /**
   * Get all research notes for a user
   */
  static async getByUserId(userId: string): Promise<ResearchNote[]> {
    const { data, error } = await supabase
      .from('research_notes')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  /**
   * Get research notes linked to a specific script
   */
  static async getByScriptId(scriptId: string): Promise<ResearchNote[]> {
    const { data, error } = await supabase
      .from('research_notes')
      .select('*')
      .contains('linked_scripts', [scriptId])
      .order('updated_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  /**
   * Search research notes
   */
  static async search(
    userId: string,
    query: string,
    filters?: {
      tags?: string[]
      source_type?: string
    }
  ): Promise<ResearchNote[]> {
    let queryBuilder = supabase
      .from('research_notes')
      .select('*')
      .eq('user_id', userId)
      .or(`title.ilike.%${query}%,content.ilike.%${query}%`)

    if (filters?.tags && filters.tags.length > 0) {
      queryBuilder = queryBuilder.overlaps('tags', filters.tags)
    }

    if (filters?.source_type) {
      queryBuilder = queryBuilder.eq('source_type', filters.source_type)
    }

    const { data, error } = await queryBuilder.order('updated_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  /**
   * Update a research note
   */
  static async update(noteId: string, data: Partial<ResearchNote>): Promise<ResearchNote> {
    const { data: note, error } = await supabase
      .from('research_notes')
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', noteId)
      .select()
      .single()

    if (error) throw error
    return note
  }

  /**
   * Delete a research note
   */
  static async delete(noteId: string): Promise<void> {
    const { error } = await supabase.from('research_notes').delete().eq('id', noteId)

    if (error) throw error
  }

  /**
   * Link a note to a script
   */
  static async linkToScript(noteId: string, scriptId: string): Promise<void> {
    // Get current note
    const { data: note, error: fetchError } = await supabase
      .from('research_notes')
      .select('linked_scripts')
      .eq('id', noteId)
      .single()

    if (fetchError) throw fetchError

    // Add script to linked_scripts if not already there
    const linkedScripts = note.linked_scripts || []
    if (!linkedScripts.includes(scriptId)) {
      linkedScripts.push(scriptId)

      const { error: updateError } = await supabase
        .from('research_notes')
        .update({
          linked_scripts: linkedScripts,
          updated_at: new Date().toISOString(),
        })
        .eq('id', noteId)

      if (updateError) throw updateError
    }

    // Create research link record
    const { error: linkError } = await supabase.from('research_links').insert({
      note_id: noteId,
      script_id: scriptId,
    })

    if (linkError && linkError.code !== '23505') {
      // Ignore duplicate key errors
      throw linkError
    }
  }

  /**
   * Unlink a note from a script
   */
  static async unlinkFromScript(noteId: string, scriptId: string): Promise<void> {
    // Get current note
    const { data: note, error: fetchError } = await supabase
      .from('research_notes')
      .select('linked_scripts')
      .eq('id', noteId)
      .single()

    if (fetchError) throw fetchError

    // Remove script from linked_scripts
    const linkedScripts = (note.linked_scripts || []).filter((id: string) => id !== scriptId)

    const { error: updateError } = await supabase
      .from('research_notes')
      .update({
        linked_scripts: linkedScripts,
        updated_at: new Date().toISOString(),
      })
      .eq('id', noteId)

    if (updateError) throw updateError

    // Delete research link record
    const { error: linkError } = await supabase
      .from('research_links')
      .delete()
      .eq('note_id', noteId)
      .eq('script_id', scriptId)

    if (linkError) throw linkError
  }

  /**
   * Get all tags used by a user (for autocomplete)
   */
  static async getAllTags(userId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('research_notes')
      .select('tags')
      .eq('user_id', userId)

    if (error) throw error

    // Flatten and deduplicate tags
    const allTags = new Set<string>()
    data?.forEach((note: any) => {
      note.tags?.forEach((tag: string) => allTags.add(tag))
    })

    return Array.from(allTags).sort()
  }

  /**
   * Get statistics about research notes
   */
  static async getStats(userId: string): Promise<{
    total_notes: number
    notes_by_source_type: Record<string, number>
    total_tags: number
    linked_scripts_count: number
  }> {
    const notes = await this.getByUserId(userId)

    const stats = {
      total_notes: notes.length,
      notes_by_source_type: {} as Record<string, number>,
      total_tags: 0,
      linked_scripts_count: 0,
    }

    const allTags = new Set<string>()
    const allScripts = new Set<string>()

    notes.forEach(note => {
      // Count by source type
      if (note.source_type) {
        stats.notes_by_source_type[note.source_type] =
          (stats.notes_by_source_type[note.source_type] || 0) + 1
      }

      // Collect unique tags
      note.tags?.forEach(tag => allTags.add(tag))

      // Collect unique linked scripts
      note.linked_scripts?.forEach(scriptId => allScripts.add(scriptId))
    })

    stats.total_tags = allTags.size
    stats.linked_scripts_count = allScripts.size

    return stats
  }
}
