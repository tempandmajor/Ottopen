// Production Script Formatting Utilities
// Industry-standard screenplay formatting

export interface ScriptElement {
  type:
    | 'scene_heading'
    | 'action'
    | 'character'
    | 'dialogue'
    | 'parenthetical'
    | 'transition'
    | 'dual_dialogue'
  content: string
  sceneNumber?: string
  revisionMark?: RevisionMark
  dualWith?: string // For dual dialogue
}

export interface RevisionMark {
  color: string // pink, blue, green, yellow, goldenrod, buff, salmon, cherry
  level: number // 1st revision, 2nd revision, etc.
  date: string
}

export const REVISION_COLORS = {
  1: { name: 'Blue', hex: '#0000FF' },
  2: { name: 'Pink', hex: '#FFC0CB' },
  3: { name: 'Yellow', hex: '#FFFF00' },
  4: { name: 'Green', hex: '#00FF00' },
  5: { name: 'Goldenrod', hex: '#DAA520' },
  6: { name: 'Buff', hex: '#F0DC82' },
  7: { name: 'Salmon', hex: '#FA8072' },
  8: { name: 'Cherry', hex: '#DE3163' },
}

/**
 * Add scene numbers to script
 */
export function addSceneNumbers(elements: ScriptElement[]): ScriptElement[] {
  let sceneNumber = 1
  return elements.map(element => {
    if (element.type === 'scene_heading') {
      const currentNumber = sceneNumber
      sceneNumber++
      return {
        ...element,
        sceneNumber: currentNumber.toString(),
      }
    }
    return element
  })
}

/**
 * Format dual dialogue
 */
export function formatDualDialogue(
  character1: string,
  dialogue1: string,
  character2: string,
  dialogue2: string
): ScriptElement[] {
  const spacing = '                              '
  return [
    {
      type: 'dual_dialogue',
      content: `${character1}${spacing}${character2}\n${dialogue1}${spacing}${dialogue2}`,
      dualWith: character2,
    },
  ]
}

/**
 * Add revision marks to changed content
 */
export function addRevisionMark(
  element: ScriptElement,
  revisionLevel: number,
  date: string
): ScriptElement {
  const color = REVISION_COLORS[revisionLevel as keyof typeof REVISION_COLORS]
  return {
    ...element,
    revisionMark: {
      color: color.hex,
      level: revisionLevel,
      date,
    },
  }
}

/**
 * Format scene heading with proper industry standard
 */
export function formatSceneHeading(
  interior: boolean,
  location: string,
  time: string,
  sceneNumber?: string
): string {
  const prefix = interior ? 'INT.' : 'EXT.'
  const heading = `${prefix} ${location.toUpperCase()} - ${time.toUpperCase()}`

  if (sceneNumber) {
    return `${sceneNumber}   ${heading}   ${sceneNumber}`
  }

  return heading
}

/**
 * Format character name (centered, uppercase)
 */
export function formatCharacterName(name: string, extension?: string): string {
  const formatted = name.toUpperCase()
  return extension ? `${formatted} (${extension})` : formatted
}

/**
 * Validate script element spacing
 */
export function getElementSpacing(type: ScriptElement['type']): { before: number; after: number } {
  const spacing = {
    scene_heading: { before: 2, after: 1 },
    action: { before: 1, after: 1 },
    character: { before: 1, after: 0 },
    dialogue: { before: 0, after: 1 },
    parenthetical: { before: 0, after: 0 },
    transition: { before: 1, after: 2 },
    dual_dialogue: { before: 1, after: 1 },
  }

  return spacing[type]
}

/**
 * Convert to industry-standard page count (assuming 55 lines per page)
 */
export function calculatePageCount(elements: ScriptElement[]): number {
  const linesPerPage = 55
  const totalLines = elements.reduce((acc, element) => {
    const spacing = getElementSpacing(element.type)
    const contentLines = element.content.split('\n').length
    return acc + spacing.before + contentLines + spacing.after
  }, 0)

  return Math.ceil(totalLines / linesPerPage)
}

/**
 * Generate locked page revision
 * (locks pages so changes don't shift other pages)
 */
export function lockPages(elements: ScriptElement[]): ScriptElement[] {
  // Add page break markers where needed
  const linesPerPage = 55
  let currentLineCount = 0

  return elements.map(element => {
    const spacing = getElementSpacing(element.type)
    const contentLines = element.content.split('\n').length
    const elementLines = spacing.before + contentLines + spacing.after

    currentLineCount += elementLines

    if (currentLineCount > linesPerPage) {
      currentLineCount = elementLines
      // Mark as page break before this element
      return { ...element, pageBreakBefore: true } as any
    }

    return element
  })
}
