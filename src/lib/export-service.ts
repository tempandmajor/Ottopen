// Universal Export Service
// Export scripts, documentaries, and books to multiple formats

import type { Script, ScriptElement } from '@/src/types/script-editor'
import { ScriptFormatter } from './script-formatter'

export type ExportFormat = 'pdf' | 'docx' | 'epub' | 'fdx' | 'fountain' | 'txt'

export interface ExportOptions {
  format: ExportFormat
  include_title_page?: boolean
  include_page_numbers?: boolean
  include_scene_numbers?: boolean
  watermark?: string
  metadata?: {
    author?: string
    copyright?: string
    contact?: string
  }
}

export class ExportService {
  /**
   * Export to PDF (industry-standard format)
   */
  static async exportToPDF(
    script: Script,
    elements: ScriptElement[],
    options: ExportOptions = { format: 'pdf' }
  ): Promise<Blob> {
    // Generate PDF using appropriate formatter
    const html = this.generateHTML(script, elements, options)

    // In production, use a PDF library like @react-pdf/renderer or puppeteer
    // For now, return HTML as blob (to be converted by browser or server)
    return new Blob([html], { type: 'text/html' })
  }

  /**
   * Export to Microsoft Word (.docx)
   */
  static async exportToWord(
    script: Script,
    elements: ScriptElement[],
    options: ExportOptions = { format: 'docx' }
  ): Promise<Blob> {
    // Generate Word-compatible HTML
    const html = this.generateHTML(script, elements, options)

    // In production, use a library like docx or mammoth
    // For now, return HTML with Word-specific styles
    const wordHTML = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office'
            xmlns:w='urn:schemas-microsoft-com:office:word'
            xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset="utf-8">
        <title>${script.title}</title>
      </head>
      <body>${html}</body>
      </html>
    `

    return new Blob([wordHTML], {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    })
  }

  /**
   * Export to EPUB (ebook format for books)
   * Note: This requires server-side execution due to Node.js dependencies
   */
  static async exportToEPUB(
    script: Script,
    elements: ScriptElement[],
    options: ExportOptions = { format: 'epub' }
  ): Promise<Blob> {
    if (script.script_type !== 'nonfiction_book') {
      throw new Error('EPUB export is only available for books')
    }

    // Ensure we're running server-side
    if (typeof window !== 'undefined') {
      throw new Error('EPUB export is only available server-side')
    }

    // Generate EPUB structure
    const chapters = this.splitIntoChapters(elements)

    // Import server-only EPUB generator
    const { generateEPUB } = await import('./epub-export.server')
    const buffer = await generateEPUB(script, chapters, options)

    return new Blob([buffer], { type: 'application/epub+zip' })
  }

  /**
   * Export to Final Draft (.fdx) format
   */
  static async exportToFinalDraft(
    script: Script,
    elements: ScriptElement[],
    options: ExportOptions = { format: 'fdx' }
  ): Promise<Blob> {
    if (!['screenplay', 'tv_pilot', 'stage_play'].includes(script.script_type)) {
      throw new Error('Final Draft export is only available for scripts')
    }

    const fdx = this.generateFinalDraftXML(script, elements, options)
    return new Blob([fdx], { type: 'application/xml' })
  }

  /**
   * Export to Fountain (plain text screenplay format)
   */
  static async exportToFountain(
    script: Script,
    elements: ScriptElement[],
    options: ExportOptions = { format: 'fountain' }
  ): Promise<Blob> {
    if (!['screenplay', 'tv_pilot', 'stage_play'].includes(script.script_type)) {
      throw new Error('Fountain export is only available for scripts')
    }

    const fountain = this.generateFountain(script, elements)
    return new Blob([fountain], { type: 'text/plain' })
  }

  /**
   * Export to plain text
   */
  static async exportToText(script: Script, elements: ScriptElement[]): Promise<Blob> {
    const text = elements.map(el => el.content).join('\n\n')
    return new Blob([text], { type: 'text/plain' })
  }

  /**
   * Generate HTML for rendering
   */
  private static generateHTML(
    script: Script,
    elements: ScriptElement[],
    options: ExportOptions
  ): string {
    const template = ScriptFormatter.getFormatTemplate(script.script_type, script.format_standard)

    let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${script.title}</title>
  <style>
    @page {
      size: letter;
      margin: 1in;
    }
    body {
      font-family: 'Courier Prime', 'Courier New', Courier, monospace;
      font-size: 12pt;
      line-height: 1;
      max-width: 6.5in;
      margin: 0 auto;
    }
    ${
      options.watermark
        ? `.watermark {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-45deg);
      font-size: 72pt;
      opacity: 0.1;
      z-index: -1;
    }`
        : ''
    }
  </style>
</head>
<body>`

    if (options.watermark) {
      html += `<div class="watermark">${options.watermark}</div>`
    }

    if (options.include_title_page) {
      html += this.generateTitlePage(script, options.metadata)
    }

    // Render elements
    elements.forEach((el, index) => {
      const styles = template[el.element_type] || template.action
      html += `<div style="${this.stylesToCSS(styles)}">${this.escapeHTML(el.content)}</div>`
    })

    html += `</body></html>`
    return html
  }

  /**
   * Generate title page
   */
  private static generateTitlePage(script: Script, metadata?: ExportOptions['metadata']): string {
    return `
      <div style="page-break-after: always; text-align: center; padding-top: 3in;">
        <h1 style="font-size: 18pt; text-transform: uppercase; margin-bottom: 1in;">
          ${script.title}
        </h1>
        ${metadata?.author ? `<p>by ${metadata.author}</p>` : ''}
        ${metadata?.copyright ? `<p style="margin-top: 2in; font-size: 10pt;">${metadata.copyright}</p>` : ''}
        ${metadata?.contact ? `<p style="font-size: 10pt;">${metadata.contact}</p>` : ''}
      </div>
    `
  }

  /**
   * Split book elements into chapters
   */
  private static splitIntoChapters(elements: ScriptElement[]): ScriptElement[][] {
    const chapters: ScriptElement[][] = []
    let currentChapter: ScriptElement[] = []

    elements.forEach(el => {
      if (el.element_type === 'chapter_title' && currentChapter.length > 0) {
        chapters.push(currentChapter)
        currentChapter = [el]
      } else {
        currentChapter.push(el)
      }
    })

    if (currentChapter.length > 0) {
      chapters.push(currentChapter)
    }

    return chapters
  }

  /**
   * Generate Final Draft XML (.fdx)
   */
  private static generateFinalDraftXML(
    script: Script,
    elements: ScriptElement[],
    options: ExportOptions
  ): string {
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<FinalDraft DocumentType="Script" Template="No" Version="5">
  <Content>
    <Paragraph>
      <Text>${script.title}</Text>
    </Paragraph>
`

    elements.forEach(el => {
      const fdxType = this.elementTypeToFDX(el.element_type)
      xml += `    <Paragraph Type="${fdxType}">
      <Text>${this.escapeXML(el.content)}</Text>
    </Paragraph>
`
    })

    xml += `  </Content>
</FinalDraft>`

    return xml
  }

  /**
   * Generate Fountain format
   */
  private static generateFountain(script: Script, elements: ScriptElement[]): string {
    let fountain = `Title: ${script.title}\n`
    if (script.logline) fountain += `Logline: ${script.logline}\n`
    fountain += `\n===\n\n`

    elements.forEach(el => {
      switch (el.element_type) {
        case 'scene_heading':
          fountain += `${el.content.toUpperCase()}\n\n`
          break
        case 'action':
          fountain += `${el.content}\n\n`
          break
        case 'character':
          fountain += `${el.content.toUpperCase()}\n`
          break
        case 'dialogue':
          fountain += `${el.content}\n\n`
          break
        case 'parenthetical':
          fountain += `(${el.content})\n`
          break
        case 'transition':
          fountain += `${el.content.toUpperCase()}:\n\n`
          break
        default:
          fountain += `${el.content}\n\n`
      }
    })

    return fountain
  }

  /**
   * Convert element type to Final Draft XML type
   */
  private static elementTypeToFDX(elementType: string): string {
    const mapping: Record<string, string> = {
      scene_heading: 'Scene Heading',
      action: 'Action',
      character: 'Character',
      dialogue: 'Dialogue',
      parenthetical: 'Parenthetical',
      transition: 'Transition',
      shot: 'Shot',
    }
    return mapping[elementType] || 'Action'
  }

  /**
   * Convert styles object to CSS string
   */
  private static stylesToCSS(styles: any): string {
    return Object.entries(styles)
      .map(([key, value]) => {
        const cssKey = key.replace(/[A-Z]/g, m => `-${m.toLowerCase()}`)
        return `${cssKey}: ${value}`
      })
      .join('; ')
  }

  /**
   * Escape HTML special characters
   */
  private static escapeHTML(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
  }

  /**
   * Escape XML special characters
   */
  private static escapeXML(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;')
  }
}
