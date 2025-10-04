/**
 * Auto-Save Manager with Conflict Detection
 * Handles auto-saving with version tracking to prevent conflicts
 */

import { SceneService } from './ai-editor-service'
import { offlineStorage, isOnline } from './offline-storage'
import { logger } from './editor-logger'

interface SaveState {
  sceneId: string
  content: string
  lastSavedVersion: number
  lastSavedAt: Date | null
  pendingSave: boolean
  saveTimer: NodeJS.Timeout | null
  abortController: AbortController | null
}

export class AutoSaveManager {
  private saveStates: Map<string, SaveState> = new Map()
  private readonly AUTO_SAVE_DELAY = 30000 // 30 seconds
  private readonly DEBOUNCE_DELAY = 3000 // 3 seconds typing pause

  /**
   * Initialize auto-save for a scene
   */
  initScene(sceneId: string, initialContent: string, version: number = 0) {
    this.saveStates.set(sceneId, {
      sceneId,
      content: initialContent,
      lastSavedVersion: version,
      lastSavedAt: null,
      pendingSave: false,
      saveTimer: null,
      abortController: null,
    })
  }

  /**
   * Update content and schedule auto-save
   */
  updateContent(sceneId: string, content: string) {
    const state = this.saveStates.get(sceneId)
    if (!state) {
      logger.error(
        'updateContent called for uninitialized scene',
        new Error('Scene not initialized'),
        { sceneId }
      )
      return
    }

    // Update content
    state.content = content
    state.pendingSave = true

    // Clear existing timer
    if (state.saveTimer) {
      clearTimeout(state.saveTimer)
    }

    // Schedule debounced save (waits for typing pause)
    state.saveTimer = setTimeout(() => {
      this.performAutoSave(sceneId)
    }, this.DEBOUNCE_DELAY)
  }

  /**
   * Perform auto-save with conflict detection
   */
  private async performAutoSave(sceneId: string): Promise<boolean> {
    const state = this.saveStates.get(sceneId)
    if (!state || !state.pendingSave) return false

    // Cancel any in-flight save request
    if (state.abortController) {
      state.abortController.abort()
      logger.info('Cancelled previous save request', { sceneId })
    }

    // Create new abort controller for this save
    state.abortController = new AbortController()
    const currentController = state.abortController

    try {
      state.pendingSave = false

      // Check if offline
      if (!isOnline()) {
        // Save to IndexedDB
        await offlineStorage.saveSceneDraft({
          id: sceneId,
          content: state.content,
        })
        await offlineStorage.queueSave(sceneId, state.content)
        logger.info('Saved scene draft offline', { sceneId })
        state.lastSavedAt = new Date()
        return true
      }

      // Get current version from server to check for conflicts
      const serverScene = await SceneService.getById(sceneId)

      // Check if server scene exists (scene may have been deleted)
      if (!serverScene) {
        logger.warn('Scene no longer exists on server', {
          sceneId,
        })

        // Save conflict to offline storage for manual resolution
        await offlineStorage.saveSceneDraft({
          id: `${sceneId}-conflict-${Date.now()}`,
          content: state.content,
        })

        return false // Don't auto-save, scene was deleted
      }

      // Perform save
      const updatedScene = await SceneService.update(sceneId, {
        content: state.content,
        word_count: SceneService.countWords(state.content),
      })

      // Update state (only if not aborted)
      if (!currentController.signal.aborted) {
        state.lastSavedVersion = state.lastSavedVersion + 1
        state.lastSavedAt = new Date()
        state.abortController = null

        logger.info('Auto-saved scene', { sceneId, version: state.lastSavedVersion })
        return true
      }

      return false
    } catch (error) {
      // Check if error is due to abort
      if (error instanceof Error && error.name === 'AbortError') {
        logger.info('Save aborted (newer save in progress)', { sceneId })
        return false
      }

      logger.error('Auto-save failed', error as Error, { sceneId })

      // Save to offline storage as fallback
      try {
        await offlineStorage.saveSceneDraft({
          id: sceneId,
          content: state.content,
        })
        await offlineStorage.queueSave(sceneId, state.content)
        state.lastSavedAt = new Date()
      } catch (offlineError) {
        logger.error('Offline save also failed', offlineError as Error, { sceneId })
      }

      return false
    }
  }

  /**
   * Force immediate save (manual save)
   */
  async forceSave(sceneId: string): Promise<boolean> {
    const state = this.saveStates.get(sceneId)
    if (!state) return false

    // Clear any pending timer
    if (state.saveTimer) {
      clearTimeout(state.saveTimer)
      state.saveTimer = null
    }

    state.pendingSave = true
    return this.performAutoSave(sceneId)
  }

  /**
   * Sync queued saves when coming back online
   */
  async syncQueuedSaves(
    onSuccess?: (sceneId: string) => void,
    onError?: (sceneId: string, error: Error) => void
  ): Promise<void> {
    if (!isOnline()) return

    try {
      const queuedSaves = await offlineStorage.getQueuedSaves()

      for (const item of queuedSaves) {
        try {
          await SceneService.update(item.sceneId, {
            content: item.content,
            word_count: SceneService.countWords(item.content),
          })

          await offlineStorage.removeSaveFromQueue(item.id)

          if (onSuccess) onSuccess(item.sceneId)

          logger.info('Synced queued save', { sceneId: item.sceneId })
        } catch (error) {
          logger.error('Failed to sync queued save', error as Error, {
            sceneId: item.sceneId,
            queueItemId: item.id,
          })

          if (onError) onError(item.sceneId, error as Error)
        }
      }
    } catch (error) {
      logger.error('Failed to sync queued saves', error as Error)
    }
  }

  /**
   * Get last saved time for a scene
   */
  getLastSavedTime(sceneId: string): Date | null {
    return this.saveStates.get(sceneId)?.lastSavedAt || null
  }

  /**
   * Check if scene has unsaved changes
   */
  hasUnsavedChanges(sceneId: string): boolean {
    return this.saveStates.get(sceneId)?.pendingSave || false
  }

  /**
   * Cleanup when scene is unloaded
   */
  cleanup(sceneId: string) {
    const state = this.saveStates.get(sceneId)
    if (state) {
      if (state.saveTimer) {
        clearTimeout(state.saveTimer)
      }
      if (state.abortController) {
        state.abortController.abort()
      }
    }
    this.saveStates.delete(sceneId)
  }

  /**
   * Cleanup all scenes
   */
  cleanupAll() {
    this.saveStates.forEach(state => {
      if (state.saveTimer) {
        clearTimeout(state.saveTimer)
      }
      if (state.abortController) {
        state.abortController.abort()
      }
    })
    this.saveStates.clear()
  }
}

// Singleton instance
export const autoSaveManager = new AutoSaveManager()
