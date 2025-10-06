// AI Editor Service - Complete AI integration layer
import { createClient } from '@supabase/supabase-js'
import type {
  Manuscript,
  Chapter,
  Scene,
  Character,
  Location,
  AIExpandRequest,
  AIExpandResponse,
  AIRewriteRequest,
  AIRewriteResponse,
  AIDescribeRequest,
  AIDescribeResponse,
  AIBrainstormRequest,
  AIBrainstormResponse,
  AICritiqueRequest,
  AICritiqueResponse,
  PlotThread,
  PlotPoint,
  WritingGoal,
  SceneVersion,
  CharacterRelationship,
  ResearchNote,
  CritiqueReport,
  ManuscriptCollaborator,
  SceneComment,
} from '@/src/types/ai-editor'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ============================================================================
// MANUSCRIPT OPERATIONS
// ============================================================================

export class ManuscriptService {
  static async create(userId: string, data: Partial<Manuscript>): Promise<Manuscript> {
    const { data: manuscript, error } = await supabase
      .from('manuscripts')
      .insert({
        user_id: userId,
        title: data.title || 'Untitled Manuscript',
        genre: data.genre,
        target_word_count: data.target_word_count || 80000,
        structure_type: data.structure_type || 'three-act',
        ...data,
      })
      .select()
      .single()

    if (error) throw error
    return manuscript
  }

  static async getById(id: string): Promise<Manuscript | null> {
    const { data, error } = await supabase.from('manuscripts').select('*').eq('id', id).single()

    if (error) return null
    return data
  }

  static async getUserManuscripts(userId: string): Promise<Manuscript[]> {
    const { data, error } = await supabase
      .from('manuscripts')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  static async update(id: string, updates: Partial<Manuscript>): Promise<Manuscript> {
    const { data, error } = await supabase
      .from('manuscripts')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async delete(id: string): Promise<void> {
    const { error } = await supabase.from('manuscripts').delete().eq('id', id)
    if (error) throw error
  }

  static async getWithDetails(id: string) {
    const [manuscript, chapters, characters, locations, plotThreads] = await Promise.all([
      this.getById(id),
      ChapterService.getByManuscriptId(id),
      CharacterService.getByManuscriptId(id),
      LocationService.getByManuscriptId(id),
      PlotThreadService.getByManuscriptId(id),
    ])

    return {
      ...manuscript,
      chapters,
      characters,
      locations,
      plot_threads: plotThreads,
    }
  }
}

// ============================================================================
// CHAPTER OPERATIONS
// ============================================================================

export class ChapterService {
  static async create(manuscriptId: string, data: Partial<Chapter>): Promise<Chapter> {
    // Get max order_index for this manuscript
    const { data: existingChapters } = await supabase
      .from('chapters')
      .select('order_index')
      .eq('manuscript_id', manuscriptId)
      .order('order_index', { ascending: false })
      .limit(1)

    const maxOrder = existingChapters?.[0]?.order_index ?? -1

    const { data: chapter, error } = await supabase
      .from('chapters')
      .insert({
        manuscript_id: manuscriptId,
        title: data.title || 'Untitled Chapter',
        order_index: data.order_index ?? maxOrder + 1,
        ...data,
      })
      .select()
      .single()

    if (error) throw error
    return chapter
  }

  static async getByManuscriptId(manuscriptId: string): Promise<Chapter[]> {
    const { data, error } = await supabase
      .from('chapters')
      .select('*')
      .eq('manuscript_id', manuscriptId)
      .order('order_index', { ascending: true })

    if (error) throw error
    return data || []
  }

  static async getById(id: string): Promise<Chapter | null> {
    const { data, error } = await supabase.from('chapters').select('*').eq('id', id).single()

    if (error) return null
    return data
  }

  static async update(id: string, updates: Partial<Chapter>): Promise<Chapter> {
    const { data, error } = await supabase
      .from('chapters')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async delete(id: string): Promise<void> {
    const { error } = await supabase.from('chapters').delete().eq('id', id)
    if (error) throw error
  }

  static async reorder(chapterId: string, newOrderIndex: number): Promise<void> {
    const { error } = await supabase
      .from('chapters')
      .update({ order_index: newOrderIndex })
      .eq('id', chapterId)

    if (error) throw error
  }

  static async getWithScenes(id: string) {
    const [chapter, scenes] = await Promise.all([this.getById(id), SceneService.getByChapterId(id)])

    return {
      ...chapter,
      scenes,
    }
  }
}

// ============================================================================
// SCENE OPERATIONS
// ============================================================================

export class SceneService {
  static async create(chapterId: string, data: Partial<Scene>): Promise<Scene> {
    // Get max order_index for this chapter
    const { data: existingScenes } = await supabase
      .from('scenes')
      .select('order_index')
      .eq('chapter_id', chapterId)
      .order('order_index', { ascending: false })
      .limit(1)

    const maxOrder = existingScenes?.[0]?.order_index ?? -1

    const { data: scene, error } = await supabase
      .from('scenes')
      .insert({
        chapter_id: chapterId,
        content: data.content || '',
        order_index: data.order_index ?? maxOrder + 1,
        word_count: this.countWords(data.content || ''),
        ...data,
      })
      .select()
      .single()

    if (error) throw error
    return scene
  }

  static async getByChapterId(chapterId: string): Promise<Scene[]> {
    const { data, error } = await supabase
      .from('scenes')
      .select('*')
      .eq('chapter_id', chapterId)
      .order('order_index', { ascending: true })

    if (error) throw error
    return data || []
  }

  static async getById(id: string): Promise<Scene | null> {
    const { data, error } = await supabase.from('scenes').select('*').eq('id', id).single()

    if (error) return null
    return data
  }

  static async update(id: string, updates: Partial<Scene>): Promise<Scene> {
    // Recalculate word count if content changed
    if (updates.content !== undefined) {
      updates.word_count = this.countWords(updates.content)
    }

    const { data, error } = await supabase
      .from('scenes')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async delete(id: string): Promise<void> {
    const { error } = await supabase.from('scenes').delete().eq('id', id)
    if (error) throw error
  }

  static countWords(text: string): number {
    return text.trim().split(/\s+/).filter(Boolean).length
  }

  static async saveVersion(sceneId: string, label?: string): Promise<SceneVersion> {
    const scene = await this.getById(sceneId)
    if (!scene) throw new Error('Scene not found')

    // Get next version number
    const { data: versions } = await supabase
      .from('scene_versions')
      .select('version_number')
      .eq('scene_id', sceneId)
      .order('version_number', { ascending: false })
      .limit(1)

    const nextVersion = (versions?.[0]?.version_number ?? 0) + 1

    const { data, error } = await supabase
      .from('scene_versions')
      .insert({
        scene_id: sceneId,
        content: scene.content,
        word_count: scene.word_count,
        version_number: nextVersion,
        is_auto_save: !label,
        label,
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async getVersions(sceneId: string): Promise<SceneVersion[]> {
    const { data, error } = await supabase
      .from('scene_versions')
      .select('*')
      .eq('scene_id', sceneId)
      .order('version_number', { ascending: false })

    if (error) throw error
    return data || []
  }

  static async restoreVersion(sceneId: string, versionId: string): Promise<Scene> {
    const { data: version } = await supabase
      .from('scene_versions')
      .select('*')
      .eq('id', versionId)
      .single()

    if (!version) throw new Error('Version not found')

    return await this.update(sceneId, { content: version.content })
  }
}

// ============================================================================
// CHARACTER OPERATIONS
// ============================================================================

export class CharacterService {
  static async create(manuscriptId: string, data: Partial<Character>): Promise<Character> {
    const { data: character, error } = await supabase
      .from('characters')
      .insert({
        manuscript_id: manuscriptId,
        name: data.name || 'Unnamed Character',
        role: data.role || 'supporting',
        importance_level: data.importance_level || 3,
        ...data,
      })
      .select()
      .single()

    if (error) throw error
    return character
  }

  static async getByManuscriptId(manuscriptId: string): Promise<Character[]> {
    const { data, error } = await supabase
      .from('characters')
      .select('*')
      .eq('manuscript_id', manuscriptId)
      .order('importance_level', { ascending: true })

    if (error) throw error
    return data || []
  }

  static async getById(id: string): Promise<Character | null> {
    const { data, error } = await supabase.from('characters').select('*').eq('id', id).single()

    if (error) return null
    return data
  }

  static async update(id: string, updates: Partial<Character>): Promise<Character> {
    const { data, error } = await supabase
      .from('characters')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async delete(id: string): Promise<void> {
    const { error } = await supabase.from('characters').delete().eq('id', id)
    if (error) throw error
  }

  static async addRelationship(
    manuscriptId: string,
    characterAId: string,
    characterBId: string,
    data: Partial<CharacterRelationship>
  ): Promise<CharacterRelationship> {
    const { data: relationship, error } = await supabase
      .from('character_relationships')
      .insert({
        manuscript_id: manuscriptId,
        character_a_id: characterAId,
        character_b_id: characterBId,
        relationship_type: data.relationship_type || 'friendship',
        strength: data.strength || 5,
        ...data,
      })
      .select()
      .single()

    if (error) throw error
    return relationship
  }

  static async getRelationships(characterId: string): Promise<CharacterRelationship[]> {
    const { data, error } = await supabase
      .from('character_relationships')
      .select('*')
      .or(`character_a_id.eq.${characterId},character_b_id.eq.${characterId}`)

    if (error) throw error
    return data || []
  }
}

// ============================================================================
// LOCATION OPERATIONS
// ============================================================================

export class LocationService {
  static async create(manuscriptId: string, data: Partial<Location>): Promise<Location> {
    const { data: location, error } = await supabase
      .from('locations')
      .insert({
        manuscript_id: manuscriptId,
        name: data.name || 'Unnamed Location',
        ...data,
      })
      .select()
      .single()

    if (error) throw error
    return location
  }

  static async getByManuscriptId(manuscriptId: string): Promise<Location[]> {
    const { data, error } = await supabase
      .from('locations')
      .select('*')
      .eq('manuscript_id', manuscriptId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  static async getById(id: string): Promise<Location | null> {
    const { data, error } = await supabase.from('locations').select('*').eq('id', id).single()

    if (error) return null
    return data
  }

  static async update(id: string, updates: Partial<Location>): Promise<Location> {
    const { data, error } = await supabase
      .from('locations')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async delete(id: string): Promise<void> {
    const { error } = await supabase.from('locations').delete().eq('id', id)
    if (error) throw error
  }
}

// ============================================================================
// PLOT THREAD OPERATIONS
// ============================================================================

export class PlotThreadService {
  static async create(manuscriptId: string, data: Partial<PlotThread>): Promise<PlotThread> {
    const { data: thread, error } = await supabase
      .from('plot_threads')
      .insert({
        manuscript_id: manuscriptId,
        title: data.title || 'Untitled Plot Thread',
        type: data.type || 'subplot',
        status: data.status || 'active',
        importance: data.importance || 3,
        ...data,
      })
      .select()
      .single()

    if (error) throw error
    return thread
  }

  static async getByManuscriptId(manuscriptId: string): Promise<PlotThread[]> {
    const { data, error } = await supabase
      .from('plot_threads')
      .select('*')
      .eq('manuscript_id', manuscriptId)
      .order('importance', { ascending: true })

    if (error) throw error
    return data || []
  }

  static async update(id: string, updates: Partial<PlotThread>): Promise<PlotThread> {
    const { data, error } = await supabase
      .from('plot_threads')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async delete(id: string): Promise<void> {
    const { error } = await supabase.from('plot_threads').delete().eq('id', id)
    if (error) throw error
  }
}

// ============================================================================
// WRITING GOALS & ANALYTICS
// ============================================================================

export class WritingGoalService {
  static async create(userId: string, data: Partial<WritingGoal>): Promise<WritingGoal> {
    const { data: goal, error } = await supabase
      .from('writing_goals')
      .insert({
        user_id: userId,
        goal_type: data.goal_type || 'daily-words',
        target_value: data.target_value || 1000,
        unit: data.unit || 'words',
        period: data.period || 'daily',
        start_date: data.start_date || new Date().toISOString().split('T')[0],
        ...data,
      })
      .select()
      .single()

    if (error) throw error
    return goal
  }

  static async getUserGoals(userId: string): Promise<WritingGoal[]> {
    const { data, error } = await supabase
      .from('writing_goals')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  static async updateProgress(goalId: string, currentValue: number): Promise<WritingGoal> {
    const { data, error } = await supabase
      .from('writing_goals')
      .update({ current_value: currentValue })
      .eq('id', goalId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async startWritingSession(userId: string, manuscriptId?: string, sceneId?: string) {
    const { data, error } = await supabase
      .from('writing_sessions')
      .insert({
        user_id: userId,
        manuscript_id: manuscriptId,
        scene_id: sceneId,
        start_time: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async endWritingSession(sessionId: string, wordsWritten: number) {
    const endTime = new Date()

    const { data: session } = await supabase
      .from('writing_sessions')
      .select('start_time')
      .eq('id', sessionId)
      .single()

    if (!session) throw new Error('Session not found')

    const startTime = new Date(session.start_time)
    const durationMinutes = Math.floor((endTime.getTime() - startTime.getTime()) / 60000)

    const { data, error } = await supabase
      .from('writing_sessions')
      .update({
        end_time: endTime.toISOString(),
        duration_minutes: durationMinutes,
        words_written: wordsWritten,
      })
      .eq('id', sessionId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async getSessions(userId: string, manuscriptId?: string) {
    let query = supabase
      .from('writing_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (manuscriptId) {
      query = query.eq('manuscript_id', manuscriptId)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  }

  static async getDailyStats(userId: string, date?: string) {
    if (date) {
      const { data, error } = await supabase
        .from('daily_writing_stats')
        .select('*')
        .eq('user_id', userId)
        .eq('date', date)
        .single()

      if (error && error.code !== 'PGRST116') throw error
      return data
    }

    // Get all stats for the user
    const { data, error } = await supabase
      .from('daily_writing_stats')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })

    if (error) throw error
    return data || []
  }

  static async updateDailyStats(
    userId: string,
    date: string,
    stats: {
      words_written?: number
      scenes_completed?: number
      writing_minutes?: number
      sessions_count?: number
    }
  ) {
    const { data, error } = await supabase
      .from('daily_writing_stats')
      .upsert({
        user_id: userId,
        date,
        ...stats,
      })
      .select()
      .single()

    if (error) throw error
    return data
  }
}

// ============================================================================
// RESEARCH & NOTES
// ============================================================================

export class ResearchService {
  static async create(manuscriptId: string, data: Partial<ResearchNote>): Promise<ResearchNote> {
    const { data: note, error } = await supabase
      .from('research_notes')
      .insert({
        manuscript_id: manuscriptId,
        title: data.title || 'Untitled Note',
        ...data,
      })
      .select()
      .single()

    if (error) throw error
    return note
  }

  static async getByManuscriptId(manuscriptId: string): Promise<ResearchNote[]> {
    const { data, error } = await supabase
      .from('research_notes')
      .select('*')
      .eq('manuscript_id', manuscriptId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  static async update(id: string, updates: Partial<ResearchNote>): Promise<ResearchNote> {
    const { data, error } = await supabase
      .from('research_notes')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async delete(id: string): Promise<void> {
    const { error } = await supabase.from('research_notes').delete().eq('id', id)
    if (error) throw error
  }
}

// ============================================================================
// COLLABORATION
// ============================================================================

export class CollaborationService {
  static async inviteCollaborator(
    manuscriptId: string,
    email: string,
    role: 'beta-reader' | 'co-author' | 'editor' | 'viewer'
  ): Promise<ManuscriptCollaborator> {
    const { data, error } = await supabase
      .from('manuscript_collaborators')
      .insert({
        manuscript_id: manuscriptId,
        email,
        role,
        invite_status: 'pending',
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async acceptInvite(inviteId: string, userId: string) {
    const { data, error } = await supabase
      .from('manuscript_collaborators')
      .update({
        user_id: userId,
        invite_status: 'accepted',
        accepted_at: new Date().toISOString(),
      })
      .eq('id', inviteId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async getCollaborators(manuscriptId: string): Promise<ManuscriptCollaborator[]> {
    const { data, error } = await supabase
      .from('manuscript_collaborators')
      .select('*')
      .eq('manuscript_id', manuscriptId)

    if (error) throw error
    return data || []
  }

  static async addComment(
    sceneId: string,
    userId: string,
    content: string,
    highlightText?: string,
    characterPosition?: number
  ): Promise<SceneComment> {
    const { data, error } = await supabase
      .from('scene_comments')
      .insert({
        scene_id: sceneId,
        user_id: userId,
        content,
        highlight_text: highlightText,
        character_position: characterPosition,
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async getSceneComments(sceneId: string): Promise<SceneComment[]> {
    const { data, error } = await supabase
      .from('scene_comments')
      .select('*')
      .eq('scene_id', sceneId)
      .order('created_at', { ascending: true })

    if (error) throw error
    return data || []
  }

  static async resolveComment(commentId: string) {
    const { data, error } = await supabase
      .from('scene_comments')
      .update({ is_resolved: true })
      .eq('id', commentId)
      .select()
      .single()

    if (error) throw error
    return data
  }
}

// ============================================================================
// AI SERVICES (Fully Implemented with OpenAI/Anthropic integration)
// ============================================================================

import { getAIClient } from './ai/ai-client'
import {
  buildExpandPrompt,
  buildRewritePrompt,
  buildDescribePrompt,
  buildBrainstormPrompt,
  buildCritiquePrompt,
  buildCharacterPrompt,
  buildOutlinePrompt,
  SYSTEM_PROMPTS,
} from './ai/prompts/writing-prompts'

export class AIService {
  static async logUsage(
    userId: string,
    data: {
      manuscriptId?: string
      sceneId?: string
      feature: string
      tokensUsed: number
      model: string
      provider: string
    }
  ) {
    await supabase.from('ai_suggestions').insert({
      user_id: userId,
      manuscript_id: data.manuscriptId,
      scene_id: data.sceneId,
      feature_type: data.feature,
      tokens_used: data.tokensUsed,
      ai_model: data.model,
      ai_provider: data.provider,
    })
  }

  static async expand(
    request: AIExpandRequest,
    userId: string,
    userTier: 'free' | 'pro' | 'premium' | 'enterprise' = 'free'
  ): Promise<AIExpandResponse> {
    const client = getAIClient(userTier)

    const prompt = buildExpandPrompt({
      contextBefore: request.contextBefore,
      contextAfter: request.contextAfter,
      length: request.length,
      tone: request.tone,
    })

    const response = await client.complete(
      {
        messages: [
          { role: 'system', content: SYSTEM_PROMPTS.expand },
          { role: 'user', content: prompt },
        ],
        temperature: 0.8, // Higher for creative writing
      },
      'expand'
    )

    await this.logUsage(userId, {
      feature: 'expand',
      tokensUsed: response.tokensUsed.total,
      model: response.model,
      provider: response.provider,
    })

    return {
      suggestions: [response.content],
      tokensUsed: response.tokensUsed.total,
      model: response.model,
    }
  }

  static async rewrite(
    request: AIRewriteRequest,
    userId: string,
    userTier: 'free' | 'pro' | 'premium' | 'enterprise' = 'free'
  ): Promise<AIRewriteResponse> {
    const client = getAIClient(userTier)

    const prompt = buildRewritePrompt({
      text: request.text,
      style: request.style,
      additionalContext: request.additionalContext,
    })

    const response = await client.complete(
      {
        messages: [
          { role: 'system', content: SYSTEM_PROMPTS.rewrite },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
      },
      'rewrite'
    )

    await this.logUsage(userId, {
      feature: 'rewrite',
      tokensUsed: response.tokensUsed.total,
      model: response.model,
      provider: response.provider,
    })

    return {
      suggestions: [response.content],
      tokensUsed: response.tokensUsed.total,
      model: response.model,
    }
  }

  static async describe(
    request: AIDescribeRequest,
    userId: string,
    userTier: 'free' | 'pro' | 'premium' | 'enterprise' = 'free'
  ): Promise<AIDescribeResponse> {
    const client = getAIClient(userTier)

    const prompt = buildDescribePrompt({
      subject: request.subject,
      type: request.type,
      context: request.context,
      senses: request.senses,
      atmosphere: request.atmosphere,
    })

    const response = await client.complete(
      {
        messages: [
          { role: 'system', content: SYSTEM_PROMPTS.describe },
          { role: 'user', content: prompt },
        ],
        temperature: 0.9, // Very high for vivid descriptions
      },
      'describe'
    )

    await this.logUsage(userId, {
      feature: 'describe',
      tokensUsed: response.tokensUsed.total,
      model: response.model,
      provider: response.provider,
    })

    return {
      descriptions: [response.content],
      tokensUsed: response.tokensUsed.total,
      model: response.model,
    }
  }

  static async brainstorm(
    request: AIBrainstormRequest,
    userId: string,
    userTier: 'free' | 'pro' | 'premium' | 'enterprise' = 'free'
  ): Promise<AIBrainstormResponse> {
    const client = getAIClient(userTier)

    const prompt = buildBrainstormPrompt({
      type: request.type,
      genre: request.genre || 'general fiction',
      context: request.premise || request.additionalContext,
      count: request.count || 10,
    })

    const response = await client.complete(
      {
        messages: [
          { role: 'system', content: SYSTEM_PROMPTS.brainstorm },
          { role: 'user', content: prompt },
        ],
        temperature: 0.95, // Maximum creativity
      },
      'brainstorm'
    )

    await this.logUsage(userId, {
      feature: 'brainstorm',
      tokensUsed: response.tokensUsed.total,
      model: response.model,
      provider: response.provider,
    })

    // Parse the response into structured suggestions
    const lines = response.content.split('\n').filter(line => line.trim())
    const suggestions: Array<{ title: string; description: string }> = []

    let currentTitle = ''
    let currentDesc = ''

    for (const line of lines) {
      if (/^\d+\./.test(line)) {
        if (currentTitle) {
          suggestions.push({ title: currentTitle, description: currentDesc.trim() })
        }
        const parts = line.split(/^\d+\.\s*/)
        currentTitle = parts[1] || ''
        currentDesc = ''
      } else if (line.trim()) {
        currentDesc += line + ' '
      }
    }

    if (currentTitle) {
      suggestions.push({ title: currentTitle, description: currentDesc.trim() })
    }

    return {
      suggestions:
        suggestions.length > 0 ? suggestions : [{ title: 'Ideas', description: response.content }],
      tokensUsed: response.tokensUsed.total,
      model: response.model,
    }
  }

  static async critique(
    request: AICritiqueRequest,
    userId: string,
    userTier: 'free' | 'pro' | 'premium' | 'enterprise' = 'free'
  ): Promise<AICritiqueResponse> {
    const client = getAIClient(userTier)

    const prompt = buildCritiquePrompt({
      text: request.content,
      focusAreas: request.critiqueTypes as any,
    })

    const response = await client.complete(
      {
        messages: [
          { role: 'system', content: SYSTEM_PROMPTS.critique },
          { role: 'user', content: prompt },
        ],
        temperature: 0.5, // Lower for analytical tasks
        maxTokens: 3000,
      },
      'critique'
    )

    await this.logUsage(userId, {
      feature: 'critique',
      tokensUsed: response.tokensUsed.total,
      model: response.model,
      provider: response.provider,
    })

    // Parse critique response
    const content = response.content
    const scoreMatch = content.match(/score[:\s]+(\d+)\/10/i)
    const overallScore = scoreMatch ? parseInt(scoreMatch[1]) : 7

    return {
      overallScore,
      issues: [],
      strengths: [],
      recommendations: content,
      tokensUsed: response.tokensUsed.total,
      model: response.model,
    }
  }

  static async generateCharacterProfile(
    name: string,
    role: string,
    genre: string,
    userId: string,
    additionalContext?: string,
    userTier: 'free' | 'pro' | 'premium' | 'enterprise' = 'free'
  ): Promise<Partial<Character>> {
    const client = getAIClient(userTier)

    const prompt = buildCharacterPrompt({
      name,
      role: role as any,
      genre,
      context: additionalContext,
    })

    const response = await client.complete(
      {
        messages: [
          { role: 'system', content: SYSTEM_PROMPTS.character },
          { role: 'user', content: prompt },
        ],
        temperature: 0.8,
        maxTokens: 2000,
      },
      'character'
    )

    await this.logUsage(userId, {
      feature: 'character',
      tokensUsed: response.tokensUsed.total,
      model: response.model,
      provider: response.provider,
    })

    // Parse the response into character fields
    return {
      name,
      role: role as any,
      personality_summary: response.content,
      notes: `Generated with AI (${response.model})`,
    }
  }

  static async generatePlotOutline(
    premise: string,
    genre: string,
    structureType: string,
    userId: string,
    userTier: 'free' | 'pro' | 'premium' | 'enterprise' = 'free'
  ): Promise<{ title: string; description: string; act: number }[]> {
    const client = getAIClient(userTier)

    const prompt = buildOutlinePrompt({
      premise,
      genre,
      structure: structureType as any,
    })

    const response = await client.complete(
      {
        messages: [
          { role: 'system', content: SYSTEM_PROMPTS.outline },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        maxTokens: 3000,
      },
      'outline'
    )

    await this.logUsage(userId, {
      feature: 'outline',
      tokensUsed: response.tokensUsed.total,
      model: response.model,
      provider: response.provider,
    })

    // Parse into plot points
    const beats: { title: string; description: string; act: number }[] = []
    const lines = response.content.split('\n').filter(line => line.trim())

    let currentAct = 1
    for (const line of lines) {
      if (/act\s+(\d+)/i.test(line)) {
        const match = line.match(/act\s+(\d+)/i)
        currentAct = match ? parseInt(match[1]) : currentAct
      }

      if (/^\d+\./.test(line) || /^-/.test(line)) {
        const cleanLine = line.replace(/^\d+\.\s*/, '').replace(/^-\s*/, '')
        beats.push({
          title: cleanLine.split(':')[0] || cleanLine.substring(0, 50),
          description: cleanLine,
          act: currentAct,
        })
      }
    }

    return beats
  }

  static async checkUsageLimits(userId: string): Promise<{
    wordsUsed: number
    wordsLimit: number
    imagesUsed: number
    imagesLimit: number
    canUseAI: boolean
  }> {
    const today = new Date()
    const periodStart = new Date(today.getFullYear(), today.getMonth(), 1)
      .toISOString()
      .split('T')[0]
    const periodEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0)
      .toISOString()
      .split('T')[0]

    const { data } = await supabase
      .from('ai_usage')
      .select('*')
      .eq('user_id', userId)
      .eq('period_start', periodStart)
      .single()

    if (!data) {
      // Create new usage record with default free tier limits
      const { data: newUsage } = await supabase
        .from('ai_usage')
        .insert({
          user_id: userId,
          period_start: periodStart,
          period_end: periodEnd,
          word_limit: 10000,
          image_limit: 0,
        })
        .select()
        .single()

      return {
        wordsUsed: 0,
        wordsLimit: 10000,
        imagesUsed: 0,
        imagesLimit: 0,
        canUseAI: true,
      }
    }

    return {
      wordsUsed: data.words_generated,
      wordsLimit: data.word_limit,
      imagesUsed: data.images_generated,
      imagesLimit: data.image_limit,
      canUseAI: data.words_generated < data.word_limit,
    }
  }
}

// ============================================================================
// EXPORT SERVICE (for manuscript formatting and export)
// ============================================================================
// NOTE: Legacy ExportService for manuscript editor
// The new Writing Suite uses src/lib/export-service.ts instead
// This class is kept for backwards compatibility with the fiction manuscript editor
// ============================================================================

export class ExportService {
  static async exportToDocx(manuscriptId: string): Promise<Blob> {
    // Legacy export - superseded by src/lib/export-service.ts
    // For manuscripts, use the existing export/docx-export.ts implementation
    const { exportToDocx } = await import('@/src/lib/export/docx-export')
    // This requires manuscript data - implementation depends on manuscript schema
    throw new Error('Use the manuscript export functionality in app/editor/[manuscriptId]')
  }

  static async exportToPDF(manuscriptId: string): Promise<Blob> {
    // Legacy export - superseded by src/lib/export-service.ts
    throw new Error('Use the manuscript export functionality in app/editor/[manuscriptId]')
  }

  static async exportToEPUB(manuscriptId: string): Promise<Blob> {
    // Legacy export - superseded by src/lib/export-service.ts
    throw new Error('Use the manuscript export functionality in app/editor/[manuscriptId]')
  }

  static async generateQueryLetter(manuscriptId: string): Promise<string> {
    // Future feature for manuscript editor
    throw new Error('Query letter generation is a planned feature')
  }

  static async generateSynopsis(
    manuscriptId: string,
    length: 'short' | 'medium' | 'long'
  ): Promise<string> {
    // Future feature for manuscript editor
    throw new Error('Synopsis generation is a planned feature')
  }
}
