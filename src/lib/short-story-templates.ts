/**
 * Short Story Templates Library
 * Pre-built templates for various short story formats with structure guidance
 */

export type ShortStoryType = 'flash' | 'short' | 'novelette' | 'novella'
export type StoryStructure =
  | 'one-scene'
  | 'three-act-compressed'
  | 'in-media-res'
  | 'frame-story'
  | 'vignette'

export interface StructureSection {
  name: string
  wordCount: number
  percentage: number
  description: string
}

export interface ShortStoryTemplate {
  id: string
  name: string
  description: string
  shortStoryType: ShortStoryType
  storyStructure: StoryStructure
  targetWordCountMin: number
  targetWordCountMax: number
  targetPageCount: number
  recommendedGenres: string[]
  structureBreakdown: {
    sections: StructureSection[]
  }
  writingTips: string[]
  exampleOutline: string
  aiPromptTemplate: string
}

export const SHORT_STORY_TYPES = {
  flash: {
    name: 'Flash Fiction',
    wordRange: '< 1,500 words',
    pageRange: '1-6 pages',
    description: 'Ultra-short narrative focused on a single moment or revelation',
    typicalLength: 1000,
  },
  short: {
    name: 'Short Story',
    wordRange: '1,500-7,500 words',
    pageRange: '6-30 pages',
    description: 'Traditional short story with complete narrative arc',
    typicalLength: 5000,
  },
  novelette: {
    name: 'Novelette',
    wordRange: '7,500-17,500 words',
    pageRange: '30-70 pages',
    description: 'Extended short story allowing for subplots and deeper development',
    typicalLength: 12000,
  },
  novella: {
    name: 'Novella',
    wordRange: '17,500-40,000 words',
    pageRange: '70-160 pages',
    description: 'Short novel with full character development and complex plotting',
    typicalLength: 30000,
  },
} as const

export const STORY_STRUCTURES = {
  'one-scene': {
    name: 'Single Scene',
    description: 'Entire story takes place in one continuous scene or moment',
    bestFor: ['flash', 'short'],
    benefits: 'Maximum impact, intense focus, no transition overhead',
  },
  'three-act-compressed': {
    name: 'Three-Act (Compressed)',
    description: 'Classic setup-confrontation-resolution structure optimized for short form',
    bestFor: ['short', 'novelette', 'novella'],
    benefits: 'Familiar structure, clear progression, satisfying arc',
  },
  'in-media-res': {
    name: 'In Media Res',
    description: 'Start in the middle of action, reveal backstory through context',
    bestFor: ['flash', 'short', 'novelette'],
    benefits: 'Immediate engagement, efficient storytelling, built-in mystery',
  },
  'frame-story': {
    name: 'Frame Story',
    description: 'Story within a story, outer narrative frames inner tale',
    bestFor: ['short', 'novelette', 'novella'],
    benefits: 'Multiple perspectives, thematic depth, structural interest',
  },
  vignette: {
    name: 'Vignette',
    description: 'Impressionistic snapshot prioritizing mood over plot',
    bestFor: ['flash', 'short'],
    benefits: 'Artistic freedom, atmospheric, emotionally resonant',
  },
} as const

// Flash Fiction Templates
export const FLASH_FICTION_TEMPLATES: Omit<ShortStoryTemplate, 'id'>[] = [
  {
    name: 'Flash Fiction - Twist Ending',
    description:
      'Ultra-short story with a surprising revelation or twist at the end. Perfect for single-scene narratives.',
    shortStoryType: 'flash',
    storyStructure: 'one-scene',
    targetWordCountMin: 500,
    targetWordCountMax: 1500,
    targetPageCount: 2,
    recommendedGenres: ['thriller', 'horror', 'sci-fi', 'mystery'],
    structureBreakdown: {
      sections: [
        {
          name: 'Setup',
          wordCount: 300,
          percentage: 40,
          description: 'Establish character, setting, and immediate situation',
        },
        {
          name: 'Development',
          wordCount: 200,
          percentage: 27,
          description: 'Build tension or develop the central conflict',
        },
        {
          name: 'Twist',
          wordCount: 250,
          percentage: 33,
          description: 'Deliver unexpected revelation that recontextualizes everything',
        },
      ],
    },
    writingTips: [
      'Every word must count - no filler',
      'Start as close to the ending as possible',
      'The twist should be surprising but inevitable in hindsight',
      'Use strong imagery and sensory details',
      'End with impact - no explanation needed',
    ],
    exampleOutline:
      'A woman receives a mysterious package. As she opens it, she discovers it contains her own obituary - dated tomorrow.',
    aiPromptTemplate:
      'Write a flash fiction story about {theme} with a twist ending. Keep it under 1000 words, start in the middle of action, and ensure the twist recontextualizes the entire narrative.',
  },
  {
    name: 'Vignette - Slice of Life',
    description:
      'Impressionistic snapshot of a moment, place, or character. Focuses on atmosphere and emotion over plot.',
    shortStoryType: 'flash',
    storyStructure: 'vignette',
    targetWordCountMin: 800,
    targetWordCountMax: 2000,
    targetPageCount: 4,
    recommendedGenres: ['literary', 'contemporary', 'experimental'],
    structureBreakdown: {
      sections: [
        {
          name: 'Establishing Mood',
          wordCount: 400,
          percentage: 30,
          description: 'Create atmosphere through sensory details',
        },
        {
          name: 'Central Image/Moment',
          wordCount: 800,
          percentage: 50,
          description: 'Focus on the core experience or observation',
        },
        {
          name: 'Resonance',
          wordCount: 300,
          percentage: 20,
          description: 'Leave reader with emotional or thematic echo',
        },
      ],
    },
    writingTips: [
      'Prioritize mood and atmosphere over plot',
      'Use vivid sensory details - make reader feel present',
      'Focus on a single moment, image, or realization',
      'Allow ambiguity - suggest rather than explain',
      'End with an image or feeling, not resolution',
    ],
    exampleOutline:
      'An elderly woman sits in a diner at 3 AM, watching the rain and remembering her daughter who moved away twenty years ago.',
    aiPromptTemplate:
      'Create a vignette capturing {theme}. Focus on atmosphere, sensory details, and emotional resonance. Suggest meaning through imagery rather than explicit narrative.',
  },
]

// Short Story Templates
export const SHORT_STORY_TEMPLATES: Omit<ShortStoryTemplate, 'id'>[] = [
  {
    name: 'Classic Short Story - Three Act',
    description:
      'Traditional short story structure with clear beginning, middle, and end. Ideal for character-driven narratives.',
    shortStoryType: 'short',
    storyStructure: 'three-act-compressed',
    targetWordCountMin: 3000,
    targetWordCountMax: 7500,
    targetPageCount: 10,
    recommendedGenres: ['literary', 'drama', 'romance', 'contemporary'],
    structureBreakdown: {
      sections: [
        {
          name: 'Act 1: Setup',
          wordCount: 1500,
          percentage: 25,
          description: 'Introduce protagonist, world, and inciting incident',
        },
        {
          name: 'Act 2: Confrontation',
          wordCount: 3500,
          percentage: 50,
          description: 'Rising action, obstacles, character development, crisis',
        },
        {
          name: 'Act 3: Resolution',
          wordCount: 1500,
          percentage: 25,
          description: 'Climax and denouement, character transformation',
        },
      ],
    },
    writingTips: [
      'Focus on one main character and their arc',
      'Limit the timeframe - hours to weeks, not years',
      'Every scene should advance plot or character',
      'Build to a single powerful climax',
      'Show character transformation through action',
    ],
    exampleOutline:
      'A retired teacher reconnects with a former student who changed her life. Through their conversation, she realizes she needs to forgive herself for a past mistake.',
    aiPromptTemplate:
      "Write a {genre} short story about {theme}. Focus on a single character's transformation over a compressed timeframe. Build to an emotional climax and resolution.",
  },
  {
    name: 'Character Study - Internal Conflict',
    description:
      "Deep dive into a character's psyche and internal struggles. Plot serves character revelation.",
    shortStoryType: 'short',
    storyStructure: 'vignette',
    targetWordCountMin: 2500,
    targetWordCountMax: 5000,
    targetPageCount: 7,
    recommendedGenres: ['literary', 'psychological', 'drama'],
    structureBreakdown: {
      sections: [
        {
          name: 'Character Introduction',
          wordCount: 1000,
          percentage: 25,
          description: 'Show character in their world, hint at inner conflict',
        },
        {
          name: 'Conflict Exploration',
          wordCount: 2000,
          percentage: 50,
          description: 'Reveal internal struggle through interactions and introspection',
        },
        {
          name: 'Moment of Truth',
          wordCount: 1000,
          percentage: 25,
          description: 'Character faces their truth - acceptance, denial, or transformation',
        },
      ],
    },
    writingTips: [
      'Use internal monologue sparingly but effectively',
      "Show character's internal state through external actions",
      "Focus on a pivotal moment or day in character's life",
      'Layer symbolism and subtext',
      "Resolution doesn't require complete change - awareness is enough",
    ],
    exampleOutline:
      "A middle-aged man spends his Saturday organizing his deceased father's workshop, confronting the relationship they never had.",
    aiPromptTemplate:
      'Create a character study exploring {theme}. Focus on internal conflict made external through behavior, choices, and a pivotal moment of self-awareness.',
  },
  {
    name: 'Mystery - Revelation Structure',
    description:
      'Story built around a central mystery with a climactic revelation. Reader discovers truth with protagonist.',
    shortStoryType: 'short',
    storyStructure: 'in-media-res',
    targetWordCountMin: 4000,
    targetWordCountMax: 7500,
    targetPageCount: 10,
    recommendedGenres: ['mystery', 'thriller', 'crime', 'suspense'],
    structureBreakdown: {
      sections: [
        {
          name: 'Hook',
          wordCount: 750,
          percentage: 10,
          description: 'Open with intriguing situation mid-action',
        },
        {
          name: 'Investigation',
          wordCount: 3000,
          percentage: 50,
          description: 'Protagonist seeks answers, false leads, rising tension',
        },
        {
          name: 'Revelation',
          wordCount: 1500,
          percentage: 20,
          description: 'Truth revealed through discovery or confession',
        },
        {
          name: 'Aftermath',
          wordCount: 750,
          percentage: 10,
          description: 'Consequences and new understanding',
        },
      ],
    },
    writingTips: [
      'Plant clues throughout that make sense in retrospect',
      "Use red herrings sparingly - mislead but don't cheat",
      'Build tension through withholding information',
      'Make the revelation emotionally resonant, not just clever',
      'Ensure the solution is fair - reader could theoretically solve it',
    ],
    exampleOutline:
      'A detective arrives at a crime scene only to realize the victim is someone from her own past. As she investigates, she uncovers a connection to her own carefully hidden secret.',
    aiPromptTemplate:
      'Write a mystery story about {theme} where the protagonist discovers {revelation}. Plant clues throughout and build to a satisfying revelation that recontextualizes earlier events.',
  },
]

// Novelette Templates
export const NOVELETTE_TEMPLATES: Omit<ShortStoryTemplate, 'id'>[] = [
  {
    name: 'Novelette - Expanded Narrative',
    description:
      'Longer short story allowing for subplots and deeper character development. Room for world-building.',
    shortStoryType: 'novelette',
    storyStructure: 'three-act-compressed',
    targetWordCountMin: 10000,
    targetWordCountMax: 17500,
    targetPageCount: 35,
    recommendedGenres: ['sci-fi', 'fantasy', 'historical', 'adventure'],
    structureBreakdown: {
      sections: [
        {
          name: 'Act 1: World & Conflict',
          wordCount: 3500,
          percentage: 25,
          description: 'Establish world, characters, and central conflict',
        },
        {
          name: 'Act 2A: Complications',
          wordCount: 3500,
          percentage: 25,
          description: 'Initial attempts to resolve conflict, setbacks, character development',
        },
        {
          name: 'Act 2B: Crisis',
          wordCount: 3500,
          percentage: 25,
          description: 'Deepening conflict, subplot convergence, dark moment',
        },
        {
          name: 'Act 3: Climax & Resolution',
          wordCount: 3500,
          percentage: 25,
          description: 'Final confrontation, resolution, character transformation',
        },
      ],
    },
    writingTips: [
      'Develop 2-3 main characters with distinct arcs',
      'Include one significant subplot that enhances main plot',
      'Build world details organically through action',
      'Create multiple layers of conflict (internal, interpersonal, external)',
      'Allow breathing room for character moments between action',
    ],
    exampleOutline:
      'A scientist discovers a message from the future warning about an event in 72 hours. As she investigates, she must decide whether to prevent it or let history unfold.',
    aiPromptTemplate:
      'Develop a novelette exploring {theme}. Create a rich world with layered conflicts, 2-3 developed characters, and a subplot that enhances the main narrative. Build to a powerful climax.',
  },
]

// Novella Templates
export const NOVELLA_TEMPLATES: Omit<ShortStoryTemplate, 'id'>[] = [
  {
    name: 'Novella - Complete Story Arc',
    description:
      'Short novel with complete story arc, multiple viewpoints possible, and full character development.',
    shortStoryType: 'novella',
    storyStructure: 'three-act-compressed',
    targetWordCountMin: 20000,
    targetWordCountMax: 40000,
    targetPageCount: 80,
    recommendedGenres: ['all genres'],
    structureBreakdown: {
      sections: [
        {
          name: 'Act 1: Setup',
          wordCount: 8000,
          percentage: 25,
          description: 'Establish world, multiple characters, central conflict, inciting incident',
        },
        {
          name: 'Act 2A: Rising Action',
          wordCount: 8000,
          percentage: 25,
          description: 'Character development, plot complications, subplot introduction',
        },
        {
          name: 'Act 2B: Crisis',
          wordCount: 8000,
          percentage: 25,
          description: 'Major setback, dark moment, character testing, subplots deepen',
        },
        {
          name: 'Act 3: Resolution',
          wordCount: 8000,
          percentage: 25,
          description: 'Climax, subplot resolution, character transformation, denouement',
        },
      ],
    },
    writingTips: [
      'Develop multiple characters with interconnected arcs',
      'Include 2-3 significant subplots that enhance themes',
      'Build a fully realized world with history and depth',
      'Allow for multiple viewpoints if needed',
      'Create layered themes explored through different characters',
      'Pace yourself - you have room to breathe and develop',
    ],
    exampleOutline:
      "In a coastal town, three strangers' lives intersect during a hurricane: a meteorologist predicting the storm, a fisherman refusing to evacuate, and a journalist seeking redemption.",
    aiPromptTemplate:
      'Write a novella about {theme}. Develop multiple characters with intersecting arcs, layered conflicts, and rich world-building. Explore your theme from different angles through your characters.',
  },
]

// All templates combined
export const ALL_SHORT_STORY_TEMPLATES = [
  ...FLASH_FICTION_TEMPLATES,
  ...SHORT_STORY_TEMPLATES,
  ...NOVELETTE_TEMPLATES,
  ...NOVELLA_TEMPLATES,
]

// Helper functions
export function getTemplatesByType(type: ShortStoryType): Omit<ShortStoryTemplate, 'id'>[] {
  return ALL_SHORT_STORY_TEMPLATES.filter(template => template.shortStoryType === type)
}

export function getTemplatesByStructure(
  structure: StoryStructure
): Omit<ShortStoryTemplate, 'id'>[] {
  return ALL_SHORT_STORY_TEMPLATES.filter(template => template.storyStructure === structure)
}

export function getTemplatesByGenre(genre: string): Omit<ShortStoryTemplate, 'id'>[] {
  return ALL_SHORT_STORY_TEMPLATES.filter(
    template =>
      template.recommendedGenres.includes(genre.toLowerCase()) ||
      template.recommendedGenres.includes('all genres')
  )
}

export function recommendStructureByWordCount(wordCount: number): StoryStructure {
  if (wordCount < 1500) {
    return 'one-scene'
  } else if (wordCount < 5000) {
    return 'three-act-compressed'
  } else if (wordCount < 10000) {
    return 'in-media-res'
  } else {
    return 'three-act-compressed'
  }
}

export function getShortStoryTypeByWordCount(wordCount: number): ShortStoryType {
  if (wordCount < 1500) return 'flash'
  if (wordCount < 7500) return 'short'
  if (wordCount < 17500) return 'novelette'
  return 'novella'
}

export function getRecommendedWordCount(type: ShortStoryType): {
  min: number
  max: number
  typical: number
} {
  const typeInfo = SHORT_STORY_TYPES[type]
  return {
    min: type === 'flash' ? 500 : type === 'short' ? 1500 : type === 'novelette' ? 7500 : 17500,
    max: type === 'flash' ? 1500 : type === 'short' ? 7500 : type === 'novelette' ? 17500 : 40000,
    typical: typeInfo.typicalLength,
  }
}
