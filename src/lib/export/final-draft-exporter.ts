// Final Draft (.fdx) Export
// Industry-standard XML format for Final Draft software

import { XMLBuilder } from 'fast-xml-parser'

export interface FinalDraftElement {
  type:
    | 'Scene Heading'
    | 'Action'
    | 'Character'
    | 'Dialogue'
    | 'Parenthetical'
    | 'Transition'
    | 'Shot'
  text: string
  sceneNumber?: string
  dualDialogue?: boolean
}

export interface FinalDraftScript {
  title: string
  author: string
  elements: FinalDraftElement[]
  contact?: string
  copyright?: string
  draftDate?: string
}

export class FinalDraftExporter {
  static async exportToFDX(script: FinalDraftScript): Promise<string> {
    const fdxDocument = {
      '?xml': {
        '@_version': '1.0',
        '@_encoding': 'UTF-8',
        '@_standalone': 'no',
      },
      FinalDraft: {
        '@_DocumentType': 'Script',
        '@_Template': 'No',
        '@_Version': '3',
        Content: {
          TitlePage: this.buildTitlePage(script),
          Paragraph: this.buildParagraphs(script.elements),
        },
      },
    }

    const builder = new XMLBuilder({
      ignoreAttributes: false,
      format: true,
      suppressEmptyNode: true,
      attributeNamePrefix: '@_',
    })

    return builder.build(fdxDocument)
  }

  private static buildTitlePage(script: FinalDraftScript) {
    const titlePageContent: any = {
      Content: [{ Paragraph: { Text: script.title, '@_Type': 'Title' } }],
    }

    if (script.author) {
      titlePageContent.Content.push({
        Paragraph: { Text: `Written by\n${script.author}`, '@_Type': 'Author' },
      })
    }

    if (script.contact) {
      titlePageContent.Content.push({
        Paragraph: { Text: script.contact, '@_Type': 'Contact' },
      })
    }

    if (script.copyright) {
      titlePageContent.Content.push({
        Paragraph: { Text: script.copyright, '@_Type': 'Copyright' },
      })
    }

    if (script.draftDate) {
      titlePageContent.Content.push({
        Paragraph: { Text: script.draftDate, '@_Type': 'Draft Date' },
      })
    }

    return titlePageContent
  }

  private static buildParagraphs(elements: FinalDraftElement[]) {
    return elements.map(element => {
      const paragraph: any = {
        '@_Type': element.type,
        Text: element.text,
      }

      if (element.sceneNumber) {
        paragraph['@_Number'] = element.sceneNumber
      }

      if (element.dualDialogue) {
        paragraph['@_DualDialogue'] = 'true'
      }

      return paragraph
    })
  }

  static async convertScriptToFDX(scriptContent: string): Promise<string> {
    const elements = this.parseScriptContent(scriptContent)
    const script: FinalDraftScript = {
      title: 'Untitled Script',
      author: '',
      elements,
    }
    return this.exportToFDX(script)
  }

  private static parseScriptContent(content: string): FinalDraftElement[] {
    const lines = content.split('\n')
    const elements: FinalDraftElement[] = []
    let currentCharacter: string | null = null

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const trimmed = line.trim()

      if (!trimmed) continue

      // Scene Heading (ALL CAPS, starts with INT. or EXT.)
      if (/^(INT\.|EXT\.|INT\/EXT\.|I\/E\.)/.test(trimmed)) {
        const sceneMatch = trimmed.match(/#(\d+[A-Z]?)#/)
        elements.push({
          type: 'Scene Heading',
          text: trimmed.replace(/#\d+[A-Z]?#/g, '').trim(),
          sceneNumber: sceneMatch ? sceneMatch[1] : undefined,
        })
        currentCharacter = null
      }
      // Transition (ALL CAPS, ends with TO:)
      else if (/^[A-Z\s]+TO:$/.test(trimmed)) {
        elements.push({
          type: 'Transition',
          text: trimmed,
        })
        currentCharacter = null
      }
      // Character (ALL CAPS, centered, not a scene heading)
      else if (/^[A-Z\s\(\)]+$/.test(trimmed) && trimmed.length < 40 && !trimmed.includes('.')) {
        currentCharacter = trimmed
        elements.push({
          type: 'Character',
          text: trimmed,
        })
      }
      // Parenthetical (in parentheses after character)
      else if (/^\(.+\)$/.test(trimmed) && currentCharacter) {
        elements.push({
          type: 'Parenthetical',
          text: trimmed,
        })
      }
      // Dialogue (follows character or parenthetical)
      else if (currentCharacter) {
        elements.push({
          type: 'Dialogue',
          text: trimmed,
        })
      }
      // Action (everything else)
      else {
        elements.push({
          type: 'Action',
          text: trimmed,
        })
        currentCharacter = null
      }
    }

    return elements
  }
}

// API Route Helper
export async function generateFDXExport(scriptId: string, userId: string): Promise<Buffer> {
  // This would fetch from your database
  // For now, return a basic structure
  const script: FinalDraftScript = {
    title: 'Sample Script',
    author: 'Screenwriter',
    elements: [
      {
        type: 'Scene Heading',
        text: 'INT. COFFEE SHOP - DAY',
        sceneNumber: '1',
      },
      {
        type: 'Action',
        text: 'SARAH, 30s, sits at a corner table, laptop open.',
      },
      {
        type: 'Character',
        text: 'SARAH',
      },
      {
        type: 'Dialogue',
        text: 'This is where it all begins.',
      },
    ],
    draftDate: new Date().toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }),
  }

  const fdxContent = await FinalDraftExporter.exportToFDX(script)
  return Buffer.from(fdxContent, 'utf-8')
}
