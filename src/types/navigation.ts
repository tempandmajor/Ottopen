// Types for editor navigation system

export interface Chapter {
  id: string
  manuscript_id: string
  title: string
  order_index: number
  word_count: number
  content: string | null
  created_at: string
  updated_at: string
}

export interface Scene {
  id: string
  chapter_id: string | null
  manuscript_id: string
  title: string | null
  order_index: number
  word_count: number
  content: string | null
  pov_character: string | null
  location: string | null
  time_of_day: string | null
  created_at: string
  updated_at: string
}

export interface ChapterWithScenes extends Chapter {
  scenes: Scene[]
}

export interface ScriptSceneHeading {
  id: string
  element_type: 'scene_heading'
  content: string
  page_number?: number
  order_index: number
}

export interface ScriptAct {
  act_number: number
  title: string
  scenes: ScriptSceneHeading[]
  start_page?: number
  end_page?: number
}

export type NavigationContext = 'app' | 'ai-editor' | 'script-editor'

export interface NavigationItem {
  id: string
  title: string
  type: 'chapter' | 'scene' | 'act' | 'sequence'
  order_index: number
  word_count?: number
  page_number?: number
  children?: NavigationItem[]
  isExpanded?: boolean
  isActive?: boolean
}
