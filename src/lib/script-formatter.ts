// Script Formatting Engine
// Industry-standard screenplay, TV, and stage play formatting

import type {
  ElementType,
  ScriptType,
  FormatStandard,
  FormatTemplate,
  ElementStyles,
  LocationType,
  TimeOfDay,
} from '@/src/types/script-editor'

// ============================================================================
// FORMATTING TEMPLATES
// ============================================================================

export const SCREENPLAY_FORMAT: FormatTemplate = {
  scene_heading: {
    fontFamily: "'Courier Prime', 'Courier New', Courier, monospace",
    fontSize: '12pt',
    marginLeft: '1.5in',
    marginRight: '7.5in',
    textTransform: 'uppercase',
    fontWeight: 'bold',
    paddingTop: '12pt',
    paddingBottom: '6pt',
  },
  action: {
    fontFamily: "'Courier Prime', 'Courier New', Courier, monospace",
    fontSize: '12pt',
    marginLeft: '1.5in',
    marginRight: '7.5in',
    paddingBottom: '6pt',
  },
  character: {
    fontFamily: "'Courier Prime', 'Courier New', Courier, monospace",
    fontSize: '12pt',
    marginLeft: '3.7in',
    textAlign: 'left',
    textTransform: 'uppercase',
    paddingTop: '6pt',
  },
  dialogue: {
    fontFamily: "'Courier Prime', 'Courier New', Courier, monospace",
    fontSize: '12pt',
    marginLeft: '2.5in',
    marginRight: '6in',
  },
  parenthetical: {
    fontFamily: "'Courier Prime', 'Courier New', Courier, monospace",
    fontSize: '12pt',
    marginLeft: '3.1in',
    marginRight: '5.5in',
  },
  transition: {
    fontFamily: "'Courier Prime', 'Courier New', Courier, monospace",
    fontSize: '12pt',
    marginLeft: '6in',
    textAlign: 'right',
    textTransform: 'uppercase',
    paddingTop: '6pt',
    paddingBottom: '6pt',
  },
  shot: {
    fontFamily: "'Courier Prime', 'Courier New', Courier, monospace",
    fontSize: '12pt',
    marginLeft: '1.5in',
    textTransform: 'uppercase',
    paddingTop: '6pt',
  },
  dual_dialogue: {
    fontFamily: "'Courier Prime', 'Courier New', Courier, monospace",
    fontSize: '12pt',
    marginLeft: '1.5in',
    marginRight: '4.5in', // Narrower for side-by-side
  },
}

export const STAGE_PLAY_FORMAT: FormatTemplate = {
  scene_heading: {
    fontFamily: "'Courier Prime', 'Courier New', Courier, monospace",
    fontSize: '12pt',
    marginLeft: '0in',
    textAlign: 'center',
    textTransform: 'uppercase',
    fontWeight: 'bold',
    paddingTop: '24pt',
    paddingBottom: '12pt',
  },
  action: {
    fontFamily: "'Courier Prime', 'Courier New', Courier, monospace",
    fontSize: '12pt',
    marginLeft: '0in',
    marginRight: '0in',
    paddingBottom: '6pt',
  },
  character: {
    fontFamily: "'Courier Prime', 'Courier New', Courier, monospace",
    fontSize: '12pt',
    marginLeft: '2in',
    textTransform: 'uppercase',
    paddingTop: '12pt',
  },
  dialogue: {
    fontFamily: "'Courier Prime', 'Courier New', Courier, monospace",
    fontSize: '12pt',
    marginLeft: '1in',
    marginRight: '1in',
  },
  parenthetical: {
    fontFamily: "'Courier Prime', 'Courier New', Courier, monospace",
    fontSize: '12pt',
    marginLeft: '1.5in',
    fontStyle: 'italic',
  },
  transition: {
    fontFamily: "'Courier Prime', 'Courier New', Courier, monospace",
    fontSize: '12pt',
    marginLeft: '0in',
    textAlign: 'center',
    paddingTop: '12pt',
    paddingBottom: '12pt',
  },
  shot: {
    fontFamily: "'Courier Prime', 'Courier New', Courier, monospace",
    fontSize: '12pt',
    marginLeft: '0in',
    paddingTop: '6pt',
  },
  stage_direction: {
    fontFamily: "'Courier Prime', 'Courier New', Courier, monospace",
    fontSize: '12pt',
    marginLeft: '2in',
    fontStyle: 'italic',
    paddingBottom: '6pt',
  },
}

export const DOCUMENTARY_FORMAT: FormatTemplate = {
  scene_heading: {
    fontFamily: "'Courier Prime', 'Courier New', Courier, monospace",
    fontSize: '12pt',
    marginLeft: '1.5in',
    marginRight: '7.5in',
    textTransform: 'uppercase',
    fontWeight: 'bold',
    paddingTop: '12pt',
    paddingBottom: '6pt',
  },
  action: {
    fontFamily: "'Courier Prime', 'Courier New', Courier, monospace",
    fontSize: '12pt',
    marginLeft: '1.5in',
    marginRight: '7.5in',
    paddingBottom: '6pt',
  },
  character: {
    fontFamily: "'Courier Prime', 'Courier New', Courier, monospace",
    fontSize: '12pt',
    marginLeft: '3.7in',
    textAlign: 'left',
    textTransform: 'uppercase',
    paddingTop: '6pt',
  },
  dialogue: {
    fontFamily: "'Courier Prime', 'Courier New', Courier, monospace",
    fontSize: '12pt',
    marginLeft: '2.5in',
    marginRight: '6in',
  },
  parenthetical: {
    fontFamily: "'Courier Prime', 'Courier New', Courier, monospace",
    fontSize: '12pt',
    marginLeft: '3in',
    fontStyle: 'italic',
  },
  transition: {
    fontFamily: "'Courier Prime', 'Courier New', Courier, monospace",
    fontSize: '12pt',
    marginLeft: '6in',
    textAlign: 'right',
    paddingTop: '6pt',
  },
  shot: {
    fontFamily: "'Courier Prime', 'Courier New', Courier, monospace",
    fontSize: '12pt',
    marginLeft: '1.5in',
    textTransform: 'uppercase',
    paddingTop: '6pt',
  },
  // Documentary-specific elements
  narration: {
    fontFamily: "'Courier Prime', 'Courier New', Courier, monospace",
    fontSize: '12pt',
    marginLeft: '2in',
    marginRight: '2in',
    fontStyle: 'italic',
    paddingBottom: '6pt',
  },
  interview_question: {
    fontFamily: "'Courier Prime', 'Courier New', Courier, monospace",
    fontSize: '12pt',
    marginLeft: '2in',
    fontWeight: 'bold',
    paddingTop: '6pt',
  },
  interview_answer: {
    fontFamily: "'Courier Prime', 'Courier New', Courier, monospace",
    fontSize: '12pt',
    marginLeft: '2.5in',
    marginRight: '2in',
    paddingBottom: '6pt',
  },
  b_roll: {
    fontFamily: "'Courier Prime', 'Courier New', Courier, monospace",
    fontSize: '12pt',
    marginLeft: '1.5in',
    textTransform: 'uppercase',
    paddingTop: '6pt',
  },
  archive_footage: {
    fontFamily: "'Courier Prime', 'Courier New', Courier, monospace",
    fontSize: '12pt',
    marginLeft: '1.5in',
    textTransform: 'uppercase',
    fontStyle: 'italic',
    paddingTop: '6pt',
  },
  lower_third: {
    fontFamily: "'Courier Prime', 'Courier New', Courier, monospace",
    fontSize: '11pt',
    marginLeft: '3in',
    fontWeight: 'bold',
    paddingTop: '4pt',
  },
  act_break: {
    fontFamily: "'Courier Prime', 'Courier New', Courier, monospace",
    fontSize: '14pt',
    marginLeft: '0in',
    textAlign: 'center',
    textTransform: 'uppercase',
    fontWeight: 'bold',
    paddingTop: '24pt',
    paddingBottom: '24pt',
  },
}

// ============================================================================
// ELEMENT DETECTION
// ============================================================================

export class ScriptFormatter {
  /**
   * Detect element type from text content
   */
  static detectElementType(
    line: string,
    previousElement?: ElementType,
    scriptType: ScriptType = 'screenplay'
  ): ElementType {
    const trimmed = line.trim()

    // Empty line
    if (!trimmed) {
      return 'action'
    }

    // Scene heading detection
    if (this.isSceneHeading(trimmed)) {
      return 'scene_heading'
    }

    // Transition detection
    if (this.isTransition(trimmed)) {
      return 'transition'
    }

    // Shot detection
    if (this.isShot(trimmed)) {
      return 'shot'
    }

    // Parenthetical detection
    if (this.isParenthetical(trimmed)) {
      return 'parenthetical'
    }

    // Character name detection (must come after previous dialogue or action)
    if (this.isCharacterName(trimmed, previousElement)) {
      return 'character'
    }

    // Dialogue (follows character or parenthetical)
    if (previousElement === 'character' || previousElement === 'parenthetical') {
      return 'dialogue'
    }

    // Default to action
    return 'action'
  }

  /**
   * Check if line is a scene heading
   */
  static isSceneHeading(line: string): boolean {
    // INT. COFFEE SHOP - DAY
    // EXT. STREET - NIGHT
    // INT/EXT. CAR - CONTINUOUS
    const pattern =
      /^(INT|EXT|INT\/EXT|I\/E)\.\s+.+\s+-\s+(DAY|NIGHT|DAWN|DUSK|MORNING|AFTERNOON|EVENING|CONTINUOUS|LATER|SAME TIME)/i
    return pattern.test(line)
  }

  /**
   * Check if line is a transition
   */
  static isTransition(line: string): boolean {
    const transitions = [
      'CUT TO:',
      'FADE TO:',
      'FADE IN:',
      'FADE OUT',
      'DISSOLVE TO:',
      'MATCH CUT TO:',
      'JUMP CUT TO:',
      'SMASH CUT TO:',
      'FADE TO BLACK',
      'FADE TO WHITE',
    ]

    return transitions.some(t => line.toUpperCase() === t)
  }

  /**
   * Check if line is a shot
   */
  static isShot(line: string): boolean {
    const shots = [
      'CLOSE ON',
      'CLOSE UP',
      'WIDE SHOT',
      'ANGLE ON',
      'POV',
      'INSERT',
      'BACK TO',
      'AERIAL SHOT',
      'ESTABLISHING SHOT',
    ]

    return shots.some(s => line.toUpperCase().startsWith(s))
  }

  /**
   * Check if line is a parenthetical
   */
  static isParenthetical(line: string): boolean {
    return /^\(.+\)$/.test(line.trim())
  }

  /**
   * Check if line is a character name
   */
  static isCharacterName(line: string, previousElement?: ElementType): boolean {
    // Must be all uppercase
    if (line !== line.toUpperCase()) {
      return false
    }

    // Should not follow another character (unless it's dual dialogue)
    if (previousElement === 'dialogue') {
      return false
    }

    // Should be relatively short (character names aren't long)
    if (line.length > 40) {
      return false
    }

    // Can have extensions: JOHN (V.O.), SARAH (O.S.), etc.
    const hasValidExtension =
      /\((V\.O\.|O\.S\.|O\.C\.|CONT\'D|FILTERED)\)$/i.test(line) || !/\(/.test(line)

    return hasValidExtension
  }

  /**
   * Parse scene heading into components
   */
  static parseSceneHeading(line: string): {
    location_type: LocationType
    location: string
    time_of_day: TimeOfDay
  } | null {
    const match = line.match(/^(INT|EXT|INT\/EXT|I\/E)\.\s+(.+?)\s+-\s+(.+)$/i)

    if (!match) return null

    const locationTypeMap: Record<string, LocationType> = {
      INT: 'INT',
      EXT: 'EXT',
      'INT/EXT': 'INT/EXT',
      'I/E': 'INT/EXT',
    }

    return {
      location_type: locationTypeMap[match[1].toUpperCase()] || 'INT',
      location: match[2].trim(),
      time_of_day: match[3].trim().toUpperCase() as TimeOfDay,
    }
  }

  /**
   * Parse character name and extract extensions
   */
  static parseCharacterName(line: string): {
    name: string
    extension?: string
  } {
    const match = line.match(/^(.+?)\s*(\([^)]+\))?$/)

    if (!match) {
      return { name: line.trim() }
    }

    return {
      name: match[1].trim(),
      extension: match[2]?.replace(/[()]/g, '').trim(),
    }
  }

  /**
   * Auto-format text input
   */
  static autoFormat(text: string, elementType: ElementType): string {
    switch (elementType) {
      case 'scene_heading':
        return this.formatSceneHeading(text)
      case 'character':
        return this.formatCharacterName(text)
      case 'transition':
        return text.toUpperCase()
      case 'shot':
        return text.toUpperCase()
      default:
        return text
    }
  }

  /**
   * Format scene heading
   */
  static formatSceneHeading(text: string): string {
    // INT. coffee shop - day -> INT. COFFEE SHOP - DAY
    const parts = text.split('-')
    if (parts.length !== 2) return text.toUpperCase()

    const [location, timeOfDay] = parts
    return `${location.trim().toUpperCase()} - ${timeOfDay.trim().toUpperCase()}`
  }

  /**
   * Format character name
   */
  static formatCharacterName(text: string): string {
    // john -> JOHN
    // john (v.o.) -> JOHN (V.O.)
    return text.toUpperCase()
  }

  /**
   * Get formatting template for script type
   */
  static getFormatTemplate(
    scriptType: ScriptType,
    formatStandard: FormatStandard = 'us_industry'
  ): FormatTemplate {
    // For now, using base templates
    // Can expand with more standards (BBC, European, etc.)
    switch (scriptType) {
      case 'stage_play':
        return STAGE_PLAY_FORMAT
      case 'documentary':
        return DOCUMENTARY_FORMAT
      case 'screenplay':
      case 'tv_pilot':
      case 'radio_drama':
      default:
        return SCREENPLAY_FORMAT
    }
  }

  /**
   * Get element styles
   */
  static getElementStyles(
    elementType: ElementType,
    scriptType: ScriptType,
    formatStandard: FormatStandard = 'us_industry'
  ): ElementStyles {
    const template = this.getFormatTemplate(scriptType, formatStandard)
    return template[elementType] || template.action
  }

  /**
   * Calculate page number from element count
   * Rule of thumb: 1 page = ~55-60 lines in screenplay format
   */
  static calculatePageNumber(elementIndex: number, scriptType: ScriptType): number {
    const linesPerPage = scriptType === 'screenplay' ? 55 : 60

    return Math.floor(elementIndex / linesPerPage) + 1
  }

  /**
   * Estimate screen time from page count
   * Rule: 1 page = ~1 minute of screen time
   */
  static estimateScreenTime(pageCount: number): number {
    return Math.round(pageCount)
  }

  /**
   * Parse plain text into script elements
   */
  static parseText(
    text: string,
    scriptType: ScriptType = 'screenplay'
  ): Array<{
    element_type: ElementType
    content: string
    metadata?: Record<string, any>
  }> {
    const lines = text.split('\n')
    const elements: Array<{
      element_type: ElementType
      content: string
      metadata?: Record<string, any>
    }> = []

    let previousElement: ElementType | undefined

    for (const line of lines) {
      const trimmed = line.trim()

      // Skip completely empty lines between elements
      if (!trimmed && previousElement !== 'dialogue') {
        continue
      }

      const elementType = this.detectElementType(trimmed, previousElement, scriptType)
      const content = this.autoFormat(trimmed, elementType)

      let metadata: Record<string, any> | undefined

      // Extract metadata for scene headings
      if (elementType === 'scene_heading') {
        const parsed = this.parseSceneHeading(content)
        if (parsed) {
          metadata = {
            location_type: parsed.location_type,
            time_of_day: parsed.time_of_day,
            location: parsed.location,
          }
        }
      }

      // Extract metadata for character names
      if (elementType === 'character') {
        const parsed = this.parseCharacterName(content)
        metadata = {
          character_name: parsed.name,
          extension: parsed.extension,
        }
      }

      elements.push({
        element_type: elementType,
        content,
        metadata,
      })

      previousElement = elementType
    }

    return elements
  }

  /**
   * Get next element type based on current type (for Tab key)
   */
  static getNextElementType(
    currentType: ElementType,
    scriptType: ScriptType = 'screenplay'
  ): ElementType {
    const cycleOrder: Record<ScriptType, ElementType[]> = {
      screenplay: [
        'scene_heading',
        'action',
        'character',
        'dialogue',
        'parenthetical',
        'transition',
      ],
      tv_pilot: ['scene_heading', 'action', 'character', 'dialogue', 'parenthetical', 'transition'],
      stage_play: [
        'scene_heading',
        'action',
        'character',
        'dialogue',
        'stage_direction',
        'music_cue',
      ],
      radio_drama: [
        'scene_heading',
        'action',
        'character',
        'dialogue',
        'sound_effect',
        'music_cue',
      ],
      documentary: [
        'scene_heading',
        'narration',
        'interview_question',
        'interview_answer',
        'b_roll',
        'archive_footage',
        'act_break',
      ],
    }

    const order = cycleOrder[scriptType]
    const currentIndex = order.indexOf(currentType)
    const nextIndex = (currentIndex + 1) % order.length
    return order[nextIndex]
  }
}

// ============================================================================
// KEYBOARD SHORTCUTS
// ============================================================================

export const SCRIPT_SHORTCUTS = {
  // Tab: Move to next element type
  TAB: {
    from: {
      scene_heading: 'action',
      action: 'character',
      character: 'dialogue',
      dialogue: 'action',
      parenthetical: 'dialogue',
      transition: 'scene_heading',
    },
  },

  // Enter: Context-dependent
  ENTER: {
    from: {
      scene_heading: 'action',
      action: 'action',
      character: 'dialogue',
      dialogue: 'character',
      parenthetical: 'dialogue',
    },
  },

  // Ctrl+1-9: Quick element switching
  QUICK_SWITCH: {
    '1': 'scene_heading',
    '2': 'action',
    '3': 'character',
    '4': 'dialogue',
    '5': 'parenthetical',
    '6': 'transition',
    '7': 'shot',
  } as Record<string, ElementType>,
}

// ============================================================================
// VALIDATION
// ============================================================================

export class ScriptValidator {
  /**
   * Validate script structure
   */
  static validateStructure(elements: Array<{ element_type: ElementType; content: string }>): {
    isValid: boolean
    errors: string[]
    warnings: string[]
  } {
    const errors: string[] = []
    const warnings: string[] = []

    // Check if script starts properly
    if (elements.length > 0 && elements[0].element_type !== 'scene_heading') {
      warnings.push('Script should typically start with a scene heading')
    }

    // Check for orphaned dialogue (dialogue without character)
    let lastCharacter: string | null = null
    elements.forEach((el, idx) => {
      if (el.element_type === 'character') {
        lastCharacter = el.content
      } else if (el.element_type === 'dialogue' && !lastCharacter) {
        errors.push(`Line ${idx + 1}: Dialogue without character name`)
      } else if (el.element_type === 'scene_heading') {
        lastCharacter = null
      }
    })

    // Check for empty scenes
    let sceneElementCount = 0
    let currentScene = 0
    elements.forEach(el => {
      if (el.element_type === 'scene_heading') {
        if (currentScene > 0 && sceneElementCount < 2) {
          warnings.push(`Scene ${currentScene} appears to be empty or very short`)
        }
        currentScene++
        sceneElementCount = 0
      } else {
        sceneElementCount++
      }
    })

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    }
  }

  /**
   * Check script length (ideal: 90-120 pages for feature)
   */
  static validateLength(
    pageCount: number,
    scriptType: ScriptType
  ): {
    status: 'short' | 'good' | 'long'
    message: string
  } {
    const ranges = {
      screenplay: { min: 90, max: 120 },
      tv_pilot: { min: 25, max: 35 }, // 30-min show
      stage_play: { min: 80, max: 100 },
      radio_drama: { min: 20, max: 30 },
      documentary: { min: 30, max: 90 }, // Varies widely
    }

    const range = ranges[scriptType]

    if (pageCount < range.min) {
      return {
        status: 'short',
        message: `Script is ${range.min - pageCount} pages too short (${pageCount}/${range.min}-${range.max})`,
      }
    } else if (pageCount > range.max) {
      return {
        status: 'long',
        message: `Script is ${pageCount - range.max} pages too long (${pageCount}/${range.min}-${range.max})`,
      }
    } else {
      return {
        status: 'good',
        message: `Script length is ideal (${pageCount} pages)`,
      }
    }
  }
}
