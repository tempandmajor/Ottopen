'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import type { EditorTab } from '@/src/components/editor-tabs/editor-tabs'

interface TabState {
  tabs: EditorTab[]
  activeTabId: string | null
  timestamp: number
}

interface UseEditorTabsOptions {
  type: 'manuscript' | 'script'
  basePath: string
  maxTabs?: number
}

const TAB_STATE_KEY = 'editor-tabs-state'
const TAB_EXPIRY_MS = 24 * 60 * 60 * 1000 // 24 hours

export function useEditorTabs({ type, basePath, maxTabs = 10 }: UseEditorTabsOptions) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [tabs, setTabs] = useState<EditorTab[]>([])
  const [activeTabId, setActiveTabId] = useState<string | null>(null)

  // Load tabs from localStorage on mount
  useEffect(() => {
    loadTabsFromStorage()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Load tabs from URL query params
  useEffect(() => {
    const tabsParam = searchParams.get('tabs')
    const activeParam = searchParams.get('active')
    const newParam = searchParams.get('new')

    if (newParam === 'true') {
      // Create new tab
      createNewTab()
    } else if (tabsParam) {
      // Load tabs from URL
      const tabIds = tabsParam.split(',').filter(Boolean)
      if (tabIds.length > 0) {
        loadTabsFromIds(tabIds, activeParam || tabIds[0])
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  // Save tabs to localStorage whenever they change
  useEffect(() => {
    if (tabs.length > 0) {
      saveTabsToStorage()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabs, activeTabId])

  // Update URL when tabs change
  useEffect(() => {
    if (tabs.length > 0 && activeTabId) {
      updateURL()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabs, activeTabId])

  const loadTabsFromStorage = () => {
    try {
      const stored = localStorage.getItem(`${TAB_STATE_KEY}-${type}`)
      if (stored) {
        const state: TabState = JSON.parse(stored)
        // Check if not expired
        if (Date.now() - state.timestamp < TAB_EXPIRY_MS) {
          setTabs(state.tabs)
          setActiveTabId(state.activeTabId)
        }
      }
    } catch (error) {
      console.error('Failed to load tabs from storage:', error)
    }
  }

  const saveTabsToStorage = () => {
    try {
      const state: TabState = {
        tabs,
        activeTabId,
        timestamp: Date.now(),
      }
      localStorage.setItem(`${TAB_STATE_KEY}-${type}`, JSON.stringify(state))
    } catch (error) {
      console.error('Failed to save tabs to storage:', error)
    }
  }

  const updateURL = () => {
    const tabIds = tabs.map(t => t.fileId).join(',')
    const params = new URLSearchParams()
    params.set('tabs', tabIds)
    if (activeTabId) {
      const activeTab = tabs.find(t => t.id === activeTabId)
      if (activeTab) {
        params.set('active', activeTab.fileId)
      }
    }
    router.replace(`${basePath}?${params.toString()}`, { scroll: false })
  }

  const loadTabsFromIds = async (fileIds: string[], activeFileId: string) => {
    try {
      // Load file metadata for each ID
      const loadedTabs: EditorTab[] = await Promise.all(
        fileIds.slice(0, maxTabs).map(async (fileId, index) => {
          const data = await fetchFileMetadata(fileId)
          return {
            id: `tab-${fileId}-${Date.now()}-${index}`,
            type,
            fileId,
            title: data.title || 'Untitled',
            isDirty: false,
            lastSaved: data.updated_at ? new Date(data.updated_at) : null,
          }
        })
      )

      setTabs(loadedTabs)
      const activeTab = loadedTabs.find(t => t.fileId === activeFileId) || loadedTabs[0]
      setActiveTabId(activeTab?.id || null)
    } catch (error) {
      console.error('Failed to load tabs from IDs:', error)
    }
  }

  const fetchFileMetadata = async (
    fileId: string
  ): Promise<{ title: string; updated_at: string | null }> => {
    const endpoint = type === 'manuscript' ? `/api/manuscripts/${fileId}` : `/api/scripts/${fileId}`
    const response = await fetch(endpoint)
    if (response.ok) {
      const data = await response.json()
      return type === 'manuscript' ? data.manuscript : data.script
    }
    return { title: 'Untitled', updated_at: null }
  }

  const createNewTab = async () => {
    if (tabs.length >= maxTabs) {
      alert(`Maximum ${maxTabs} tabs allowed`)
      return
    }

    try {
      // Create new file
      const endpoint = type === 'manuscript' ? '/api/manuscripts' : '/api/scripts'
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `Untitled ${type === 'manuscript' ? 'Manuscript' : 'Script'}`,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        const file = type === 'manuscript' ? data.manuscript : data.script

        const newTab: EditorTab = {
          id: `tab-${file.id}-${Date.now()}`,
          type,
          fileId: file.id,
          title: file.title,
          isDirty: false,
          lastSaved: new Date(),
        }

        setTabs(prev => [...prev, newTab])
        setActiveTabId(newTab.id)
      }
    } catch (error) {
      console.error('Failed to create new tab:', error)
    }
  }

  const openTab = useCallback(
    (fileId: string) => {
      // Check if tab already exists
      const existingTab = tabs.find(t => t.fileId === fileId)
      if (existingTab) {
        setActiveTabId(existingTab.id)
        return
      }

      if (tabs.length >= maxTabs) {
        alert(`Maximum ${maxTabs} tabs allowed. Close a tab to open another.`)
        return
      }

      // Add to URL and let useEffect handle loading
      const tabIds = [...tabs.map(t => t.fileId), fileId].join(',')
      router.push(`${basePath}?tabs=${tabIds}&active=${fileId}`)
    },
    [tabs, maxTabs, basePath, router]
  )

  const closeTab = useCallback(
    (tabId: string) => {
      const newTabs = tabs.filter(t => t.id !== tabId)
      setTabs(newTabs)

      // If closing active tab, switch to another
      if (tabId === activeTabId) {
        const closedIndex = tabs.findIndex(t => t.id === tabId)
        const newActiveTab = newTabs[closedIndex] || newTabs[closedIndex - 1] || newTabs[0]
        setActiveTabId(newActiveTab?.id || null)
      }

      // If no tabs left, redirect to file browser
      if (newTabs.length === 0) {
        router.push(basePath.replace('/workspace', ''))
      }
    },
    [tabs, activeTabId, basePath, router]
  )

  const switchTab = useCallback((tabId: string) => {
    setActiveTabId(tabId)
  }, [])

  const markTabDirty = useCallback((tabId: string, isDirty: boolean) => {
    setTabs(prev => prev.map(tab => (tab.id === tabId ? { ...tab, isDirty } : tab)))
  }, [])

  const updateTabTitle = useCallback((tabId: string, title: string) => {
    setTabs(prev => prev.map(tab => (tab.id === tabId ? { ...tab, title } : tab)))
  }, [])

  const markTabSaved = useCallback((tabId: string) => {
    setTabs(prev =>
      prev.map(tab => (tab.id === tabId ? { ...tab, isDirty: false, lastSaved: new Date() } : tab))
    )
  }, [])

  const reorderTabs = useCallback((newTabs: EditorTab[]) => {
    setTabs(newTabs)
  }, [])

  return {
    tabs,
    activeTabId,
    activeTab: tabs.find(t => t.id === activeTabId) || null,
    openTab,
    closeTab,
    switchTab,
    createNewTab,
    markTabDirty,
    updateTabTitle,
    markTabSaved,
    reorderTabs,
  }
}
