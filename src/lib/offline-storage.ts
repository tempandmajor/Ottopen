/**
 * Offline Storage for Editor
 * Uses IndexedDB to store drafts locally when offline
 */

import { Scene } from '@/src/types/ai-editor'

const DB_NAME = 'EditorOfflineDB'
const DB_VERSION = 1
const STORE_NAME = 'scenes'
const QUEUE_STORE_NAME = 'saveQueue'

interface SaveQueueItem {
  id: string
  sceneId: string
  content: string
  timestamp: number
  retryCount: number
}

class OfflineStorage {
  private db: IDBDatabase | null = null

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = event => {
        const db = (event.target as IDBOpenDBRequest).result

        // Create scenes store
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const sceneStore = db.createObjectStore(STORE_NAME, { keyPath: 'id' })
          sceneStore.createIndex('manuscriptId', 'manuscriptId', { unique: false })
          sceneStore.createIndex('lastModified', 'lastModified', { unique: false })
        }

        // Create save queue store
        if (!db.objectStoreNames.contains(QUEUE_STORE_NAME)) {
          const queueStore = db.createObjectStore(QUEUE_STORE_NAME, { keyPath: 'id' })
          queueStore.createIndex('timestamp', 'timestamp', { unique: false })
        }
      }
    })
  }

  /**
   * Save a scene draft locally
   */
  async saveSceneDraft(scene: Partial<Scene> & { id: string }): Promise<void> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)

      const sceneData = {
        ...scene,
        lastModified: Date.now(),
        isOfflineDraft: true,
      }

      const request = store.put(sceneData)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Get a scene draft from local storage
   */
  async getSceneDraft(sceneId: string): Promise<any | null> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.get(sceneId)

      request.onsuccess = () => resolve(request.result || null)
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Get all scene drafts for a manuscript
   */
  async getManuscriptDrafts(manuscriptId: string): Promise<any[]> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly')
      const store = transaction.objectStore(STORE_NAME)
      const index = store.index('manuscriptId')
      const request = index.getAll(manuscriptId)

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Add a save operation to the queue
   */
  async queueSave(sceneId: string, content: string): Promise<void> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([QUEUE_STORE_NAME], 'readwrite')
      const store = transaction.objectStore(QUEUE_STORE_NAME)

      const queueItem: SaveQueueItem = {
        id: `${sceneId}-${Date.now()}`,
        sceneId,
        content,
        timestamp: Date.now(),
        retryCount: 0,
      }

      const request = store.put(queueItem)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Get all queued saves
   */
  async getQueuedSaves(): Promise<SaveQueueItem[]> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([QUEUE_STORE_NAME], 'readonly')
      const store = transaction.objectStore(QUEUE_STORE_NAME)
      const request = store.getAll()

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Remove a save from the queue
   */
  async removeSaveFromQueue(id: string): Promise<void> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([QUEUE_STORE_NAME], 'readwrite')
      const store = transaction.objectStore(QUEUE_STORE_NAME)
      const request = store.delete(id)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Clear all local drafts (use when successfully synced)
   */
  async clearDrafts(): Promise<void> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.clear()

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Clear all queued saves
   */
  async clearQueue(): Promise<void> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([QUEUE_STORE_NAME], 'readwrite')
      const store = transaction.objectStore(QUEUE_STORE_NAME)
      const request = store.clear()

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }
}

// Singleton instance
export const offlineStorage = new OfflineStorage()

/**
 * Check if user is online
 */
export function isOnline(): boolean {
  return navigator.onLine
}

/**
 * Add online/offline event listeners
 */
export function setupOnlineListeners(onOnline: () => void, onOffline: () => void): () => void {
  window.addEventListener('online', onOnline)
  window.addEventListener('offline', onOffline)

  return () => {
    window.removeEventListener('online', onOnline)
    window.removeEventListener('offline', onOffline)
  }
}
