// Script Version Control Manager
// Handles versioning, revision tracking, and change history

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export interface ScriptVersion {
  id: string
  scriptId: string
  versionNumber: number
  versionName: string
  description?: string
  createdBy: string
  createdAt: string
  contentSnapshot: any
  parentVersionId?: string
  isLocked: boolean
}

export interface RevisionMark {
  id: string
  scriptId: string
  elementId: string
  revisionColor:
    | 'white'
    | 'blue'
    | 'pink'
    | 'yellow'
    | 'green'
    | 'goldenrod'
    | 'buff'
    | 'salmon'
    | 'cherry'
  revisionDate: string
  revisionDescription?: string
  createdBy: string
}

export interface ChangeLogEntry {
  id: string
  scriptId: string
  versionId?: string
  userId: string
  changeType: 'insert' | 'update' | 'delete' | 'reorder'
  elementType?: string
  elementId?: string
  beforeContent?: string
  afterContent?: string
  metadata?: any
  createdAt: string
}

export interface ScriptComment {
  id: string
  scriptId: string
  elementId?: string
  userId: string
  commentText: string
  commentType: 'general' | 'suggestion' | 'question' | 'note'
  resolved: boolean
  resolvedBy?: string
  resolvedAt?: string
  createdAt: string
}

export class VersionManager {
  /**
   * Create a new version snapshot of a script
   */
  static async createVersion(
    scriptId: string,
    userId: string,
    versionName: string,
    description?: string
  ): Promise<ScriptVersion | null> {
    try {
      // Get current script content
      const { data: elements } = await supabase
        .from('script_elements')
        .select('*')
        .eq('script_id', scriptId)
        .order('order_index', { ascending: true })

      // Get last version number
      const { data: lastVersion } = await supabase
        .from('script_versions')
        .select('id, version_number')
        .eq('script_id', scriptId)
        .order('version_number', { ascending: false })
        .limit(1)
        .single()

      const newVersionNumber = (lastVersion?.version_number || 0) + 1

      // Create version snapshot
      const { data: version, error } = await supabase
        .from('script_versions')
        .insert({
          script_id: scriptId,
          version_number: newVersionNumber,
          version_name: versionName,
          description,
          created_by: userId,
          content_snapshot: { elements },
          parent_version_id: lastVersion?.id,
        })
        .select()
        .single()

      if (error) throw error
      return version as ScriptVersion
    } catch (error) {
      console.error('Failed to create version:', error)
      return null
    }
  }

  /**
   * Get all versions of a script
   */
  static async getVersions(scriptId: string): Promise<ScriptVersion[]> {
    const { data, error } = await supabase
      .from('script_versions')
      .select('*')
      .eq('script_id', scriptId)
      .order('version_number', { ascending: false })

    if (error) {
      console.error('Failed to fetch versions:', error)
      return []
    }

    return data as ScriptVersion[]
  }

  /**
   * Restore a script to a specific version
   */
  static async restoreVersion(versionId: string, userId: string): Promise<boolean> {
    try {
      const { data: version } = await supabase
        .from('script_versions')
        .select('*')
        .eq('id', versionId)
        .single()

      if (!version) return false

      const snapshot = version.content_snapshot
      const scriptId = version.script_id

      // Delete current elements
      await supabase.from('script_elements').delete().eq('script_id', scriptId)

      // Restore elements from snapshot
      if (snapshot.elements) {
        await supabase.from('script_elements').insert(
          snapshot.elements.map((elem: any) => ({
            ...elem,
            id: undefined, // Let DB generate new IDs
            created_at: undefined,
            updated_at: undefined,
          }))
        )
      }

      // Log the restore action
      await this.logChange(scriptId, userId, {
        changeType: 'update',
        versionId,
        beforeContent: 'Current version',
        afterContent: `Restored to version ${version.version_number}`,
        metadata: { restoredVersionId: versionId },
      })

      return true
    } catch (error) {
      console.error('Failed to restore version:', error)
      return false
    }
  }

  /**
   * Compare two versions and get differences
   */
  static async compareVersions(
    versionId1: string,
    versionId2: string
  ): Promise<{
    added: any[]
    removed: any[]
    modified: any[]
  }> {
    const { data: v1 } = await supabase
      .from('script_versions')
      .select('content_snapshot')
      .eq('id', versionId1)
      .single()

    const { data: v2 } = await supabase
      .from('script_versions')
      .select('content_snapshot')
      .eq('id', versionId2)
      .single()

    if (!v1 || !v2) return { added: [], removed: [], modified: [] }

    const elements1 = v1.content_snapshot.elements || []
    const elements2 = v2.content_snapshot.elements || []

    const added = elements2.filter((e2: any) => !elements1.some((e1: any) => e1.id === e2.id))

    const removed = elements1.filter((e1: any) => !elements2.some((e2: any) => e2.id === e1.id))

    const modified = elements2.filter((e2: any) => {
      const e1 = elements1.find((e: any) => e.id === e2.id)
      return e1 && e1.content !== e2.content
    })

    return { added, removed, modified }
  }

  /**
   * Add revision mark to script element
   */
  static async addRevisionMark(
    scriptId: string,
    elementId: string,
    color: RevisionMark['revisionColor'],
    description: string,
    userId: string
  ): Promise<RevisionMark | null> {
    const { data, error } = await supabase
      .from('script_revisions')
      .insert({
        script_id: scriptId,
        element_id: elementId,
        revision_color: color,
        revision_date: new Date().toISOString().split('T')[0],
        revision_description: description,
        created_by: userId,
      })
      .select()
      .single()

    if (error) {
      console.error('Failed to add revision mark:', error)
      return null
    }

    return data as RevisionMark
  }

  /**
   * Get revision marks for a script
   */
  static async getRevisionMarks(scriptId: string): Promise<RevisionMark[]> {
    const { data, error } = await supabase
      .from('script_revisions')
      .select('*')
      .eq('script_id', scriptId)
      .order('revision_date', { ascending: false })

    if (error) {
      console.error('Failed to fetch revision marks:', error)
      return []
    }

    return data as RevisionMark[]
  }

  /**
   * Log a change to the script
   */
  static async logChange(
    scriptId: string,
    userId: string,
    change: {
      changeType: ChangeLogEntry['changeType']
      versionId?: string
      elementType?: string
      elementId?: string
      beforeContent?: string
      afterContent?: string
      metadata?: any
    }
  ): Promise<void> {
    await supabase.from('script_change_log').insert({
      script_id: scriptId,
      user_id: userId,
      ...change,
    })
  }

  /**
   * Get change history for a script
   */
  static async getChangeLog(scriptId: string, limit: number = 50): Promise<ChangeLogEntry[]> {
    const { data, error } = await supabase
      .from('script_change_log')
      .select('*')
      .eq('script_id', scriptId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Failed to fetch change log:', error)
      return []
    }

    return data as ChangeLogEntry[]
  }

  /**
   * Add comment to script or element
   */
  static async addComment(
    scriptId: string,
    userId: string,
    commentText: string,
    commentType: ScriptComment['commentType'] = 'general',
    elementId?: string
  ): Promise<ScriptComment | null> {
    const { data, error } = await supabase
      .from('script_comments')
      .insert({
        script_id: scriptId,
        element_id: elementId,
        user_id: userId,
        comment_text: commentText,
        comment_type: commentType,
      })
      .select()
      .single()

    if (error) {
      console.error('Failed to add comment:', error)
      return null
    }

    return data as ScriptComment
  }

  /**
   * Get comments for a script or element
   */
  static async getComments(scriptId: string, elementId?: string): Promise<ScriptComment[]> {
    let query = supabase.from('script_comments').select('*').eq('script_id', scriptId)

    if (elementId) {
      query = query.eq('element_id', elementId)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) {
      console.error('Failed to fetch comments:', error)
      return []
    }

    return data as ScriptComment[]
  }

  /**
   * Resolve a comment
   */
  static async resolveComment(commentId: string, userId: string): Promise<boolean> {
    const { error } = await supabase
      .from('script_comments')
      .update({
        resolved: true,
        resolved_by: userId,
        resolved_at: new Date().toISOString(),
      })
      .eq('id', commentId)

    return !error
  }
}
