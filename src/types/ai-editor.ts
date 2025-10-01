// AI Editor TypeScript Types
// Complete type definitions for all database tables

export type ManuscriptStatus = 'draft' | 'revision' | 'beta' | 'submission' | 'published'
export type ManuscriptVisibility = 'private' | 'shared' | 'public'
export type StructureType = 'three-act' | 'heros-journey' | 'save-the-cat' | 'fichtean' | 'custom'
export type SceneStatus = 'draft' | 'complete' | 'needs-revision' | 'cut'
export type CharacterRole = 'protagonist' | 'antagonist' | 'supporting' | 'minor'
export type RelationshipType = 'family' | 'romance' | 'friendship' | 'rivalry' | 'mentor' | 'enemy'
export type PlotThreadType = 'main-plot' | 'subplot' | 'character-arc' | 'theme'
export type PlotThreadStatus = 'active' | 'resolved' | 'abandoned'
export type BeatType =
  | 'inciting-incident'
  | 'plot-point-1'
  | 'midpoint'
  | 'plot-point-2'
  | 'climax'
  | 'resolution'
export type EmotionalBeat = 'happy' | 'sad' | 'tense' | 'romantic' | 'action' | 'contemplative'
export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night'
export type ScenePurpose =
  | 'advance-plot'
  | 'character-development'
  | 'world-building'
  | 'tension'
  | 'exposition'
export type AIFeatureType =
  | 'expand'
  | 'rewrite'
  | 'describe'
  | 'brainstorm'
  | 'critique'
  | 'outline'
  | 'character'
  | 'plot'
export type AIActionTaken = 'accepted' | 'rejected' | 'modified' | 'ignored'
export type CritiqueType =
  | 'pacing'
  | 'dialogue'
  | 'cliches'
  | 'plot-holes'
  | 'character-consistency'
export type CollaboratorRole = 'beta-reader' | 'co-author' | 'editor' | 'viewer'
export type InviteStatus = 'pending' | 'accepted' | 'declined'
export type CommentType = 'general' | 'suggestion' | 'praise' | 'critique' | 'question'
export type QueryStatus = 'draft' | 'sent' | 'response-received'
export type SubmissionStatus = 'pending' | 'request' | 'rejection' | 'offer' | 'no-response'
export type SubmissionType = 'query' | 'partial' | 'full-manuscript'
export type EditionType = 'ebook' | 'paperback' | 'hardcover' | 'audiobook'
export type GoalType = 'daily-words' | 'weekly-words' | 'monthly-words' | 'completion-date'

// ============================================================================
// PHASE 0: FOUNDATION - Core Document Management
// ============================================================================

export interface Manuscript {
  id: string
  user_id: string
  title: string
  subtitle?: string
  genre?: string
  target_word_count: number
  current_word_count: number
  status: ManuscriptStatus
  structure_type: StructureType
  premise?: string
  logline?: string
  synopsis?: string
  notes?: string
  cover_image_url?: string
  is_series: boolean
  series_name?: string
  series_order?: number
  visibility: ManuscriptVisibility
  created_at: string
  updated_at: string
  completed_at?: string
  metadata?: Record<string, any>
}

export interface ManuscriptPart {
  id: string
  manuscript_id: string
  title: string
  description?: string
  order_index: number
  created_at: string
  updated_at: string
}

export interface Chapter {
  id: string
  manuscript_id: string
  part_id?: string
  title: string
  summary?: string
  order_index: number
  word_count: number
  target_word_count?: number
  status: SceneStatus
  notes?: string
  created_at: string
  updated_at: string
}

export interface Scene {
  id: string
  chapter_id: string
  title?: string
  content: string
  summary?: string
  order_index: number
  word_count: number
  pov_character_id?: string
  location_id?: string
  timeline_order?: number
  story_date?: string
  time_of_day?: TimeOfDay
  purpose?: ScenePurpose[]
  emotional_beat?: EmotionalBeat
  tension_level?: number
  status: SceneStatus
  notes?: string
  created_at: string
  updated_at: string
}

export interface SceneVersion {
  id: string
  scene_id: string
  content: string
  word_count: number
  version_number: number
  is_auto_save: boolean
  label?: string
  created_at: string
}

// ============================================================================
// PHASE 1: STORY PLANNING & ORGANIZATION
// ============================================================================

export interface Character {
  id: string
  manuscript_id: string
  name: string
  full_name?: string
  nickname?: string
  role: CharacterRole
  importance_level: number
  age?: number
  gender?: string
  appearance?: string
  distinguishing_features?: string
  avatar_url?: string
  personality_summary?: string
  mbti_type?: string
  enneagram_type?: string
  traits?: string[]
  quirks?: string[]
  speech_pattern?: string
  vocabulary_notes?: string
  occupation?: string
  education?: string
  birthplace?: string
  family_background?: string
  formative_events?: string
  internal_goal?: string
  external_goal?: string
  fear?: string
  lie_they_believe?: string
  truth_they_need?: string
  character_arc?: string
  first_appearance_scene_id?: string
  last_appearance_scene_id?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface CharacterRelationship {
  id: string
  manuscript_id: string
  character_a_id: string
  character_b_id: string
  relationship_type: RelationshipType
  description?: string
  strength: number
  dynamic?: string
  arc?: string
  created_at: string
}

export interface Location {
  id: string
  manuscript_id: string
  name: string
  type?: string
  parent_location_id?: string
  description?: string
  sensory_details?: string
  significance?: string
  atmosphere?: string
  history?: string
  culture_notes?: string
  climate?: string
  image_url?: string
  map_data?: Record<string, any>
  first_appearance_scene_id?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface PlotThread {
  id: string
  manuscript_id: string
  title: string
  description?: string
  type: PlotThreadType
  status: PlotThreadStatus
  introduced_scene_id?: string
  resolved_scene_id?: string
  characters?: string[]
  importance: number
  notes?: string
  color_code?: string
  created_at: string
  updated_at: string
}

export interface PlotPoint {
  id: string
  manuscript_id: string
  plot_thread_id?: string
  title: string
  description?: string
  beat_type?: BeatType
  act_number?: number
  scene_id?: string
  order_index?: number
  is_completed: boolean
  notes?: string
  created_at: string
  updated_at: string
}

export interface TimelineEvent {
  id: string
  manuscript_id: string
  title: string
  description?: string
  event_date?: string
  event_order?: number
  narrative_order?: number
  scene_id?: string
  characters?: string[]
  location_id?: string
  importance: number
  created_at: string
}

export interface Theme {
  id: string
  manuscript_id: string
  title: string
  description?: string
  examples?: string[]
  symbols?: string[]
  created_at: string
}

// ============================================================================
// RESEARCH & NOTES
// ============================================================================

export interface ResearchNote {
  id: string
  manuscript_id: string
  title: string
  content?: string
  source_url?: string
  source_title?: string
  category?: string
  tags?: string[]
  linked_scenes?: string[]
  linked_characters?: string[]
  linked_locations?: string[]
  created_at: string
  updated_at: string
}

export interface ReferenceImage {
  id: string
  manuscript_id: string
  title?: string
  image_url: string
  description?: string
  source?: string
  category?: string
  linked_character_id?: string
  linked_location_id?: string
  created_at: string
}

// ============================================================================
// WRITING GOALS & ANALYTICS
// ============================================================================

export interface WritingGoal {
  id: string
  user_id: string
  manuscript_id?: string
  goal_type: GoalType
  target_value: number
  current_value: number
  unit: string
  period?: string
  start_date: string
  end_date?: string
  is_active: boolean
  is_completed: boolean
  completed_at?: string
  created_at: string
  updated_at: string
}

export interface WritingSession {
  id: string
  user_id: string
  manuscript_id?: string
  scene_id?: string
  start_time: string
  end_time?: string
  duration_minutes?: number
  words_written: number
  starting_word_count?: number
  ending_word_count?: number
  focus_mode_used: boolean
  ai_assists_used: number
  notes?: string
  created_at: string
}

export interface DailyWritingStats {
  id: string
  user_id: string
  date: string
  words_written: number
  scenes_completed: number
  writing_minutes: number
  sessions_count: number
  is_goal_met: boolean
  current_streak: number
  created_at: string
}

// ============================================================================
// AI INTERACTION & HISTORY
// ============================================================================

export interface AISuggestion {
  id: string
  user_id: string
  manuscript_id?: string
  scene_id?: string
  feature_type: AIFeatureType
  prompt_text?: string
  context_text?: string
  ai_model: string
  suggestions: any[]
  tokens_used?: number
  action_taken?: AIActionTaken
  selected_suggestion_index?: number
  created_at: string
}

export interface AIUsage {
  id: string
  user_id: string
  period_start: string
  period_end: string
  words_generated: number
  tokens_used: number
  images_generated: number
  word_limit: number
  image_limit: number
  created_at: string
}

// ============================================================================
// MANUSCRIPT CRITIQUE & ANALYSIS
// ============================================================================

export interface CritiqueReport {
  id: string
  manuscript_id: string
  scene_id?: string
  chapter_id?: string
  critique_type: CritiqueType
  overall_score?: number
  issues_found?: any[]
  strengths?: any[]
  recommendations?: string
  ai_model?: string
  processed_at: string
  is_helpful?: boolean
  user_notes?: string
  created_at: string
}

// ============================================================================
// COLLABORATION
// ============================================================================

export interface ManuscriptCollaborator {
  id: string
  manuscript_id: string
  user_id?: string
  email?: string
  role: CollaboratorRole
  permissions: {
    can_comment: boolean
    can_edit: boolean
    can_view: boolean
  }
  invite_status: InviteStatus
  invited_at: string
  accepted_at?: string
  created_at: string
}

export interface SceneComment {
  id: string
  scene_id: string
  user_id: string
  content: string
  highlight_text?: string
  character_position?: number
  comment_type: CommentType
  is_resolved: boolean
  parent_comment_id?: string
  created_at: string
  updated_at: string
}

// ============================================================================
// WORLD-BUILDING
// ============================================================================

export interface MagicSystem {
  id: string
  manuscript_id: string
  name: string
  description?: string
  source?: string
  rules?: string
  limitations?: string
  cost?: string
  practitioners?: string[]
  visual_effects?: string
  created_at: string
  updated_at: string
}

export interface Technology {
  id: string
  manuscript_id: string
  name: string
  description?: string
  category?: string
  tech_level?: number
  how_it_works?: string
  limitations?: string
  availability?: string
  created_at: string
  updated_at: string
}

export interface Faction {
  id: string
  manuscript_id: string
  name: string
  type?: string
  description?: string
  leadership?: string
  goals?: string
  values?: string
  structure?: string
  power_level?: number
  territory?: string
  allies?: string[]
  enemies?: string[]
  created_at: string
  updated_at: string
}

export interface Culture {
  id: string
  manuscript_id: string
  name: string
  description?: string
  customs?: string
  traditions?: string
  religion?: string
  government_type?: string
  economy?: string
  language_notes?: string
  naming_conventions?: string
  clothing_style?: string
  cuisine?: string
  arts_and_entertainment?: string
  taboos?: string
  values?: string
  created_at: string
  updated_at: string
}

// ============================================================================
// PUBLISHING WORKFLOW
// ============================================================================

export interface QueryLetter {
  id: string
  manuscript_id: string
  version_number: number
  hook_paragraph?: string
  synopsis?: string
  bio?: string
  comp_titles?: string
  recipient_name?: string
  agency_name?: string
  personalization?: string
  full_text?: string
  status: QueryStatus
  sent_date?: string
  response_date?: string
  response_type?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface Submission {
  id: string
  manuscript_id: string
  agent_name?: string
  agency_name?: string
  submission_type: SubmissionType
  submitted_date: string
  response_deadline?: string
  response_received_date?: string
  status: SubmissionStatus
  response_notes?: string
  materials_sent?: string[]
  created_at: string
  updated_at: string
}

export interface ISBN {
  id: string
  manuscript_id: string
  isbn_13: string
  isbn_10?: string
  edition_type: EditionType
  purchase_date?: string
  purchase_price?: number
  assigned_date?: string
  created_at: string
}

// ============================================================================
// STORY STRUCTURE TEMPLATES
// ============================================================================

export interface StoryStructureTemplate {
  id: string
  name: string
  description?: string
  act_count: number
  beats: {
    name: string
    act: number
    percentage: number
    description: string
  }[]
  created_at: string
}

// ============================================================================
// AI EDITOR SUBSCRIPTION TIERS
// ============================================================================

export type SubscriptionTier = 'free' | 'pro' | 'premium' | 'enterprise'

export interface SubscriptionLimits {
  tier: SubscriptionTier
  maxProjects: number
  aiWordsPerMonth: number
  aiImagesPerMonth: number
  collaborators: number
  versionHistoryDays: number
  features: {
    basicEditor: boolean
    aiExpand: boolean
    aiRewrite: boolean
    aiDescribe: boolean
    aiBrainstorm: boolean
    aiCritique: boolean
    characterProfiles: boolean
    storyBible: boolean
    versionControl: boolean
    collaboration: boolean
    publishingTools: boolean
    apiAccess: boolean
    customAITraining: boolean
    prioritySupport: boolean
  }
  price: number // Monthly price in USD
}

export const SUBSCRIPTION_LIMITS: Record<SubscriptionTier, SubscriptionLimits> = {
  free: {
    tier: 'free',
    maxProjects: 1,
    aiWordsPerMonth: 10000,
    aiImagesPerMonth: 0,
    collaborators: 0,
    versionHistoryDays: 7,
    features: {
      basicEditor: true,
      aiExpand: true,
      aiRewrite: true,
      aiDescribe: false,
      aiBrainstorm: false,
      aiCritique: false,
      characterProfiles: true,
      storyBible: true,
      versionControl: true,
      collaboration: false,
      publishingTools: false,
      apiAccess: false,
      customAITraining: false,
      prioritySupport: false,
    },
    price: 0,
  },
  pro: {
    tier: 'pro',
    maxProjects: -1, // unlimited
    aiWordsPerMonth: 100000,
    aiImagesPerMonth: 20,
    collaborators: 5,
    versionHistoryDays: -1, // unlimited
    features: {
      basicEditor: true,
      aiExpand: true,
      aiRewrite: true,
      aiDescribe: true,
      aiBrainstorm: true,
      aiCritique: true,
      characterProfiles: true,
      storyBible: true,
      versionControl: true,
      collaboration: true,
      publishingTools: true,
      apiAccess: false,
      customAITraining: false,
      prioritySupport: true,
    },
    price: 20,
  },
  premium: {
    tier: 'premium',
    maxProjects: -1, // unlimited
    aiWordsPerMonth: 500000,
    aiImagesPerMonth: 100,
    collaborators: -1, // unlimited
    versionHistoryDays: -1, // unlimited
    features: {
      basicEditor: true,
      aiExpand: true,
      aiRewrite: true,
      aiDescribe: true,
      aiBrainstorm: true,
      aiCritique: true,
      characterProfiles: true,
      storyBible: true,
      versionControl: true,
      collaboration: true,
      publishingTools: true,
      apiAccess: true,
      customAITraining: true,
      prioritySupport: true,
    },
    price: 40,
  },
  enterprise: {
    tier: 'enterprise',
    maxProjects: -1,
    aiWordsPerMonth: -1, // unlimited
    aiImagesPerMonth: -1,
    collaborators: -1,
    versionHistoryDays: -1,
    features: {
      basicEditor: true,
      aiExpand: true,
      aiRewrite: true,
      aiDescribe: true,
      aiBrainstorm: true,
      aiCritique: true,
      characterProfiles: true,
      storyBible: true,
      versionControl: true,
      collaboration: true,
      publishingTools: true,
      apiAccess: true,
      customAITraining: true,
      prioritySupport: true,
    },
    price: 0, // Custom pricing
  },
}

// ============================================================================
// HELPER TYPES FOR UI
// ============================================================================

export interface ManuscriptWithDetails extends Manuscript {
  chapters?: Chapter[]
  characters?: Character[]
  locations?: Location[]
  plot_threads?: PlotThread[]
}

export interface ChapterWithScenes extends Chapter {
  scenes?: Scene[]
}

export interface SceneWithRelations extends Scene {
  pov_character?: Character
  location?: Location
  comments?: SceneComment[]
}

export interface CharacterWithRelationships extends Character {
  relationships?: (CharacterRelationship & {
    related_character?: Character
  })[]
}

// ============================================================================
// AI REQUEST/RESPONSE TYPES
// ============================================================================

export interface AIExpandRequest {
  sceneId: string
  contextBefore: string
  contextAfter: string
  length: 'sentence' | 'paragraph' | 'page'
  tone?: string
}

export interface AIExpandResponse {
  suggestions: string[]
  tokensUsed: number
  model: string
}

export interface AIRewriteRequest {
  text: string
  style: 'vivid' | 'concise' | 'tense' | 'emotional' | 'pov-change' | 'tense-change'
  additionalContext?: string
}

export interface AIRewriteResponse {
  suggestions: string[]
  tokensUsed: number
  model: string
}

export interface AIDescribeRequest {
  subject: string
  type: 'character' | 'location' | 'object'
  context: string
  senses?: ('sight' | 'sound' | 'smell' | 'taste' | 'touch')[]
  atmosphere?: string
}

export interface AIDescribeResponse {
  descriptions: string[]
  tokensUsed: number
  model: string
}

export interface AIBrainstormRequest {
  type: 'plot' | 'character-name' | 'setting' | 'theme' | 'twist' | 'conflict'
  premise?: string
  genre?: string
  additionalContext?: string
  count?: number
}

export interface AIBrainstormResponse {
  suggestions: Array<{
    title: string
    description: string
  }>
  tokensUsed: number
  model: string
}

export interface AICritiqueRequest {
  manuscriptId?: string
  chapterId?: string
  sceneId?: string
  content: string
  critiqueTypes: CritiqueType[]
}

export interface AICritiqueResponse {
  overallScore: number
  issues: Array<{
    type: string
    severity: 'low' | 'medium' | 'high'
    location: string
    description: string
    suggestion: string
  }>
  strengths: string[]
  recommendations: string
  tokensUsed: number
  model: string
}
