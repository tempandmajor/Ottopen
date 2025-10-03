// Script Editor Types

export type ScriptType = 'screenplay' | 'tv_pilot' | 'stage_play' | 'radio_drama'
export type FormatStandard = 'us_industry' | 'uk_bbc' | 'european' | 'stage'
export type RevisionColor =
  | 'white'
  | 'blue'
  | 'pink'
  | 'yellow'
  | 'green'
  | 'goldenrod'
  | 'buff'
  | 'salmon'
  | 'cherry'

export type ScriptStatus = 'draft' | 'in_progress' | 'completed' | 'in_production' | 'produced'

export type ElementType =
  | 'scene_heading'
  | 'action'
  | 'character'
  | 'dialogue'
  | 'parenthetical'
  | 'transition'
  | 'shot'
  | 'dual_dialogue'
  | 'stage_direction'
  | 'music_cue'
  | 'sound_effect'

export type BeatType =
  | 'opening_image'
  | 'theme_stated'
  | 'setup'
  | 'catalyst'
  | 'debate'
  | 'break_into_two'
  | 'b_story'
  | 'fun_and_games'
  | 'midpoint'
  | 'bad_guys_close_in'
  | 'all_is_lost'
  | 'dark_night_of_soul'
  | 'break_into_three'
  | 'finale'
  | 'final_image'
  | 'custom'

export type LocationType = 'INT' | 'EXT' | 'INT/EXT'
export type TimeOfDay = 'DAY' | 'NIGHT' | 'DAWN' | 'DUSK' | 'MORNING' | 'AFTERNOON' | 'EVENING'

export type CharacterType = 'lead' | 'supporting' | 'minor' | 'extra'
export type NoteType =
  | 'general'
  | 'dialogue'
  | 'action'
  | 'structure'
  | 'character'
  | 'pacing'
  | 'budget'
  | 'legal'

export type CollaboratorRole = 'owner' | 'writer' | 'editor' | 'reader'

// Main Script interface
export interface Script {
  id: string
  user_id: string
  title: string
  script_type: ScriptType
  format_standard: FormatStandard
  logline?: string
  genre: string[]
  page_count: number
  estimated_runtime?: number
  revision_color: RevisionColor
  revision_number: number
  is_locked: boolean
  status: ScriptStatus
  created_at: string
  updated_at: string
}

// Script Element
export interface ScriptElement {
  id: string
  script_id: string
  element_type: ElementType
  content: string
  character_id?: string
  location_id?: string
  scene_number?: string
  page_number: number
  order_index: number
  revision_mark?: string
  is_omitted: boolean
  dual_dialogue_partner_id?: string
  metadata?: {
    time_of_day?: TimeOfDay
    location_type?: LocationType
    [key: string]: any
  }
  created_at: string
  updated_at: string
}

// Beat Board
export interface ScriptBeat {
  id: string
  script_id: string
  title: string
  description?: string
  beat_type?: BeatType
  page_reference?: number
  color?: string
  order_index: number
  created_at: string
  updated_at: string
}

// Script-specific character data
export interface ScriptCharacter {
  id: string
  script_id: string
  name: string
  description?: string
  importance?: CharacterType
  dialogue_count: number
  scene_count: number
  metadata?: Record<string, any>
  created_at?: string
  updated_at?: string
}

// Script-specific location data
export interface ScriptLocation {
  id: string
  script_id: string
  name: string
  location_type?: LocationType
  description?: string
  scene_count: number
  page_count: number
  created_at?: string
  updated_at?: string
}

// Scene
export interface ScriptScene {
  id: string
  script_id: string
  scene_number: string
  location_id?: string
  location_type?: LocationType
  time_of_day?: TimeOfDay
  description?: string
  page_start: number
  page_end: number
  page_count: number
  estimated_screen_time?: number
  order_index: number
  is_omitted: boolean
  created_at: string
  updated_at: string
}

// Note
export interface ScriptNote {
  id: string
  script_id: string
  element_id?: string
  scene_id?: string
  user_id: string
  note_type: NoteType
  content: string
  is_resolved: boolean
  created_at: string
  updated_at: string
}

// Revision
export interface ScriptRevision {
  id: string
  script_id: string
  version_number: number
  revision_color: RevisionColor
  revision_date: string
  notes?: string
  page_count?: number
  word_count?: number
  created_by: string
  snapshot_data?: any
  created_at: string
}

// Collaborator
export interface ScriptCollaborator {
  id: string
  script_id: string
  user_id: string
  role: CollaboratorRole
  can_edit: boolean
  can_comment: boolean
  invited_by?: string
  joined_at: string
  last_active_at: string
}

// Share Link
export type SharePermission = 'read' | 'write' | 'comment'

export interface ScriptShareLink {
  id: string
  script_id: string
  token: string
  permission: SharePermission
  created_by: string
  expires_at?: string
  created_at: string
  last_accessed_at?: string
  access_count: number
}

// Formatting Styles
export interface ElementStyles {
  fontFamily: string
  fontSize: string
  marginLeft: string
  marginRight?: string
  textAlign?: 'left' | 'center' | 'right'
  textTransform?: 'uppercase' | 'lowercase' | 'capitalize' | 'none'
  fontWeight?: 'normal' | 'bold'
  fontStyle?: 'normal' | 'italic'
  paddingTop?: string
  paddingBottom?: string
}

export interface FormatTemplate {
  scene_heading: ElementStyles
  action: ElementStyles
  character: ElementStyles
  dialogue: ElementStyles
  parenthetical: ElementStyles
  transition: ElementStyles
  shot: ElementStyles
  dual_dialogue?: ElementStyles
  stage_direction?: ElementStyles
  music_cue?: ElementStyles
  sound_effect?: ElementStyles
}

// Production Reports
export interface ProductionReport {
  script_id: string
  title: string
  total_pages: number
  estimated_runtime: number
  scenes: SceneBreakdown[]
  characters: CharacterBreakdown[]
  locations: LocationBreakdown[]
  dayNightBreakdown: DayNightBreakdown
  intExtBreakdown: IntExtBreakdown
}

export interface SceneBreakdown {
  scene_number: string
  location: string
  location_type: LocationType
  time_of_day: TimeOfDay
  page_count: number
  characters: string[]
  description: string
}

export interface CharacterBreakdown {
  name: string
  character_type: CharacterType
  scene_count: number
  dialogue_count: number
  first_appearance: number
  last_appearance: number
  speaking_role: boolean
}

export interface LocationBreakdown {
  name: string
  location_type: LocationType
  scene_count: number
  page_count: number
  times_of_day: TimeOfDay[]
  is_practical: boolean
}

export interface DayNightBreakdown {
  day: number
  night: number
  dawn: number
  dusk: number
  other: number
}

export interface IntExtBreakdown {
  interior: number
  exterior: number
  both: number
}

// AI Features
export interface AIScriptCoverage {
  logline_strength: number // 1-10
  character_development: number // 1-10
  dialogue_quality: number // 1-10
  structure_adherence: number // 1-10
  marketability: number // 1-10
  overall_score: number // 1-10
  strengths: string[]
  weaknesses: string[]
  suggestions: string[]
  comparables: string[]
  genre_classification: string
  target_audience: string
  estimated_budget_range: string
}

export interface AIBeatSuggestion {
  beat_type: BeatType
  title: string
  description: string
  suggested_page: number
}

export interface AIDialogueEnhancement {
  original: string
  suggestions: Array<{
    text: string
    reasoning: string
    tone: string
  }>
}

export interface AIStructureAnalysis {
  act_one: {
    page_start: number
    page_end: number
    page_count: number
    ideal_range: string
    status: 'good' | 'warning' | 'error'
  }
  act_two: {
    page_start: number
    page_end: number
    page_count: number
    ideal_range: string
    status: 'good' | 'warning' | 'error'
  }
  act_three: {
    page_start: number
    page_end: number
    page_count: number
    ideal_range: string
    status: 'good' | 'warning' | 'error'
  }
  key_beats: {
    inciting_incident?: number
    lock_in?: number
    midpoint?: number
    low_point?: number
    climax?: number
  }
  pacing_issues: string[]
  recommendations: string[]
}
