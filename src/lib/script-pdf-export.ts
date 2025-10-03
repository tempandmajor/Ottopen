// Script PDF Export
// Industry-standard PDF generation for scripts

import { jsPDF } from 'jspdf'
import type { Script, ScriptElement } from '@/src/types/script-editor'

export class ScriptPDFExporter {
  /**
   * Export script to PDF in industry-standard format
   */
  static async exportToPDF(script: Script, elements: ScriptElement[]): Promise<Blob> {
    const pdf = new jsPDF({
      unit: 'in',
      format: 'letter',
      orientation: 'portrait',
    })

    // Set Courier font (industry standard)
    pdf.setFont('courier')
    pdf.setFontSize(12)

    let yPosition = 1.0 // Start 1 inch from top
    let pageNumber = 1

    // Title page
    this.addTitlePage(pdf, script)
    pdf.addPage()
    yPosition = 1.0

    // Add script elements
    for (const element of elements) {
      // Check if we need a new page (bottom margin at 10 inches)
      if (yPosition > 10) {
        pdf.addPage()
        yPosition = 1.0
        pageNumber++
      }

      const lineHeight = this.getLineHeight(element.element_type)
      const margins = this.getMargins(element.element_type)

      // Split text into lines if needed
      const maxWidth = 8.5 - margins.left - margins.right
      const lines = pdf.splitTextToSize(element.content, maxWidth)

      // Apply formatting based on element type
      pdf.setFont('courier', element.element_type === 'scene_heading' ? 'bold' : 'normal')

      for (const line of lines) {
        pdf.text(line, margins.left, yPosition)
        yPosition += lineHeight
      }

      // Add extra spacing after certain elements
      if (['scene_heading', 'character', 'transition'].includes(element.element_type)) {
        yPosition += 0.1
      }
    }

    return pdf.output('blob')
  }

  /**
   * Add title page
   */
  private static addTitlePage(pdf: jsPDF, script: Script) {
    const pageWidth = 8.5
    const pageHeight = 11

    // Title (centered, 3 inches from top)
    pdf.setFont('courier', 'bold')
    pdf.setFontSize(14)
    const titleLines = pdf.splitTextToSize(script.title.toUpperCase(), 6)
    let yPos = 3.0

    for (const line of titleLines) {
      const textWidth = pdf.getTextWidth(line)
      const xPos = (pageWidth - textWidth) / 2
      pdf.text(line, xPos, yPos)
      yPos += 0.2
    }

    // Logline (if present)
    if (script.logline) {
      pdf.setFont('courier', 'normal')
      pdf.setFontSize(12)
      yPos += 0.5
      const loglineLines = pdf.splitTextToSize(script.logline, 5)
      for (const line of loglineLines) {
        const textWidth = pdf.getTextWidth(line)
        const xPos = (pageWidth - textWidth) / 2
        pdf.text(line, xPos, yPos)
        yPos += 0.15
      }
    }

    // Writer info (centered, near bottom)
    pdf.setFont('courier', 'normal')
    pdf.setFontSize(12)
    const writerText = 'Written by'
    const writerWidth = pdf.getTextWidth(writerText)
    pdf.text(writerText, (pageWidth - writerWidth) / 2, pageHeight - 3)

    const authorText = script.user_id // In real app, would fetch user's name
    const authorWidth = pdf.getTextWidth(authorText)
    pdf.text(authorText, (pageWidth - authorWidth) / 2, pageHeight - 2.8)

    // Genre (bottom right)
    if (script.genre && script.genre.length > 0) {
      const genreText = script.genre.join(', ')
      const genreWidth = pdf.getTextWidth(genreText)
      pdf.text(genreText, pageWidth - genreWidth - 1, pageHeight - 1)
    }

    // Revision info (bottom left)
    const revisionText = `${script.revision_color} Revision ${script.revision_number}`
    pdf.text(revisionText, 1, pageHeight - 1)
  }

  /**
   * Get line height for element type
   */
  private static getLineHeight(elementType: string): number {
    const lineHeights: Record<string, number> = {
      scene_heading: 0.2,
      action: 0.15,
      character: 0.15,
      dialogue: 0.15,
      parenthetical: 0.15,
      transition: 0.2,
      shot: 0.15,
      stage_direction: 0.15,
      music_cue: 0.15,
      sound_effect: 0.15,
    }
    return lineHeights[elementType] || 0.15
  }

  /**
   * Get margins for element type (in inches)
   */
  private static getMargins(elementType: string): {
    left: number
    right: number
  } {
    const margins: Record<string, { left: number; right: number }> = {
      scene_heading: { left: 1.5, right: 1.0 },
      action: { left: 1.5, right: 1.0 },
      character: { left: 3.7, right: 2.8 }, // Centered
      dialogue: { left: 2.5, right: 2.5 },
      parenthetical: { left: 3.1, right: 3.4 },
      transition: { left: 6.0, right: 1.0 }, // Right-aligned
      shot: { left: 1.5, right: 1.0 },
      stage_direction: { left: 2.0, right: 2.0 },
      music_cue: { left: 1.5, right: 1.0 },
      sound_effect: { left: 1.5, right: 1.0 },
    }
    return margins[elementType] || { left: 1.5, right: 1.0 }
  }

  /**
   * Download PDF file
   */
  static async downloadPDF(script: Script, elements: ScriptElement[]): Promise<void> {
    const blob = await this.exportToPDF(script, elements)
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${script.title.replace(/[^a-z0-9]/gi, '_')}_${script.revision_color}_Rev${script.revision_number}.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }
}
