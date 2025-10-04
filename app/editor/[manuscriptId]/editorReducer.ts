import type {
  Manuscript,
  Chapter,
  Scene,
  Character,
  Location,
  PlotThread,
} from '@/src/types/ai-editor'

type ViewMode = 'editor' | 'story-bible' | 'outline' | 'analytics'
type SidePanel = 'none' | 'ai-assistant' | 'comments' | 'versions'

export interface EditorState {
  // Data
  manuscript: Manuscript | null
  chapters: Chapter[]
  scenes: Scene[]
  currentChapter: Chapter | null
  currentScene: Scene | null
  characters: Character[]
  locations: Location[]
  plotThreads: PlotThread[]

  // UI State
  viewMode: ViewMode
  sidePanel: SidePanel
  isLeftSidebarOpen: boolean
  isSaving: boolean
  lastSaved: Date | null
  isFocusMode: boolean
  isExportDialogOpen: boolean

  // Session
  sessionId: string | null
  sessionStartWords: number

  // AI State
  aiTextToInsert: string
}

export const initialEditorState: EditorState = {
  manuscript: null,
  chapters: [],
  scenes: [],
  currentChapter: null,
  currentScene: null,
  characters: [],
  locations: [],
  plotThreads: [],

  viewMode: 'editor',
  sidePanel: 'none',
  isLeftSidebarOpen: true,
  isSaving: false,
  lastSaved: null,
  isFocusMode: false,
  isExportDialogOpen: false,

  sessionId: null,
  sessionStartWords: 0,

  aiTextToInsert: '',
}

export type EditorAction =
  | { type: 'SET_MANUSCRIPT'; payload: Manuscript }
  | { type: 'SET_CHAPTERS'; payload: Chapter[] }
  | { type: 'ADD_CHAPTER'; payload: Chapter }
  | { type: 'SET_SCENES'; payload: Scene[] }
  | { type: 'ADD_SCENE'; payload: Scene }
  | { type: 'SET_CURRENT_CHAPTER'; payload: Chapter | null }
  | { type: 'SET_CURRENT_SCENE'; payload: Scene | null }
  | { type: 'UPDATE_CURRENT_SCENE'; payload: Partial<Scene> }
  | { type: 'SET_CHARACTERS'; payload: Character[] }
  | { type: 'SET_LOCATIONS'; payload: Location[] }
  | { type: 'SET_PLOT_THREADS'; payload: PlotThread[] }
  | { type: 'SET_VIEW_MODE'; payload: ViewMode }
  | { type: 'SET_SIDE_PANEL'; payload: SidePanel }
  | { type: 'TOGGLE_LEFT_SIDEBAR' }
  | { type: 'SET_IS_SAVING'; payload: boolean }
  | { type: 'SET_LAST_SAVED'; payload: Date | null }
  | { type: 'TOGGLE_FOCUS_MODE' }
  | { type: 'SET_EXPORT_DIALOG_OPEN'; payload: boolean }
  | { type: 'SET_SESSION_ID'; payload: string | null }
  | { type: 'SET_SESSION_START_WORDS'; payload: number }
  | { type: 'SET_AI_TEXT_TO_INSERT'; payload: string }
  | { type: 'UPDATE_MANUSCRIPT_WORD_COUNT'; payload: number }
  | {
      type: 'LOAD_MANUSCRIPT_DATA'
      payload: {
        manuscript: Manuscript
        chapters: Chapter[]
        characters: Character[]
        locations: Location[]
        plotThreads: PlotThread[]
      }
    }

export function editorReducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case 'SET_MANUSCRIPT':
      return { ...state, manuscript: action.payload }

    case 'SET_CHAPTERS':
      return { ...state, chapters: action.payload }

    case 'ADD_CHAPTER':
      return { ...state, chapters: [...state.chapters, action.payload] }

    case 'SET_SCENES':
      return { ...state, scenes: action.payload }

    case 'ADD_SCENE':
      return { ...state, scenes: [...state.scenes, action.payload] }

    case 'SET_CURRENT_CHAPTER':
      return { ...state, currentChapter: action.payload }

    case 'SET_CURRENT_SCENE':
      return { ...state, currentScene: action.payload }

    case 'UPDATE_CURRENT_SCENE':
      if (!state.currentScene) return state
      return {
        ...state,
        currentScene: {
          ...state.currentScene,
          ...action.payload,
        },
      }

    case 'SET_CHARACTERS':
      return { ...state, characters: action.payload }

    case 'SET_LOCATIONS':
      return { ...state, locations: action.payload }

    case 'SET_PLOT_THREADS':
      return { ...state, plotThreads: action.payload }

    case 'SET_VIEW_MODE':
      return { ...state, viewMode: action.payload }

    case 'SET_SIDE_PANEL':
      return { ...state, sidePanel: action.payload }

    case 'TOGGLE_LEFT_SIDEBAR':
      return { ...state, isLeftSidebarOpen: !state.isLeftSidebarOpen }

    case 'SET_IS_SAVING':
      return { ...state, isSaving: action.payload }

    case 'SET_LAST_SAVED':
      return { ...state, lastSaved: action.payload }

    case 'TOGGLE_FOCUS_MODE':
      return { ...state, isFocusMode: !state.isFocusMode }

    case 'SET_EXPORT_DIALOG_OPEN':
      return { ...state, isExportDialogOpen: action.payload }

    case 'SET_SESSION_ID':
      return { ...state, sessionId: action.payload }

    case 'SET_SESSION_START_WORDS':
      return { ...state, sessionStartWords: action.payload }

    case 'SET_AI_TEXT_TO_INSERT':
      return { ...state, aiTextToInsert: action.payload }

    case 'UPDATE_MANUSCRIPT_WORD_COUNT':
      if (!state.manuscript) return state
      return {
        ...state,
        manuscript: {
          ...state.manuscript,
          current_word_count: action.payload,
        },
      }

    case 'LOAD_MANUSCRIPT_DATA':
      return {
        ...state,
        manuscript: action.payload.manuscript,
        chapters: action.payload.chapters,
        characters: action.payload.characters,
        locations: action.payload.locations,
        plotThreads: action.payload.plotThreads,
      }

    default:
      return state
  }
}
