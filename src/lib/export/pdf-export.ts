import { jsPDF } from 'jspdf'
import type { Manuscript, Chapter, Scene } from '@/src/types/ai-editor'

interface ExportOptions {
  includeChapterNumbers?: boolean
  includeSceneSeparators?: boolean
  fontSize?: number
  lineSpacing?: number
}

export async function exportToPdf(
  manuscript: Manuscript,
  chapters: (Chapter & { scenes: Scene[] })[],
  options: ExportOptions = {}
) {
  const {
    includeChapterNumbers = true,
    includeSceneSeparators = true,
    fontSize = 12,
    lineSpacing = 1.5,
  } = options

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'letter', // 8.5" x 11"
  })

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 72 // 1 inch margins
  const contentWidth = pageWidth - 2 * margin
  let yPosition = margin

  // Helper function to add text with word wrapping
  const addText = (
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    align: 'left' | 'center' = 'left'
  ): number => {
    const lines = doc.splitTextToSize(text, maxWidth)
    lines.forEach((line: string, index: number) => {
      if (y + index * fontSize * lineSpacing > pageHeight - margin) {
        doc.addPage()
        y = margin
      }

      const xPos = align === 'center' ? pageWidth / 2 : x
      doc.text(line, xPos, y + index * fontSize * lineSpacing, { align })
    })
    return y + lines.length * fontSize * lineSpacing
  }

  // Title Page
  doc.setFontSize(24)
  doc.setFont('helvetica', 'bold')
  yPosition = addText(manuscript.title, margin, pageHeight / 3, contentWidth, 'center')

  if (manuscript.subtitle) {
    doc.setFontSize(18)
    doc.setFont('helvetica', 'normal')
    yPosition = addText(manuscript.subtitle, margin, yPosition + 20, contentWidth, 'center')
  }

  doc.setFontSize(14)
  doc.setFont('helvetica', 'normal')
  yPosition = addText('by Author', margin, yPosition + 40, contentWidth, 'center')

  // New page for content
  doc.addPage()
  yPosition = margin

  // Process chapters and scenes
  chapters.forEach((chapter, chapterIndex) => {
    // Chapter heading
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')

    const chapterTitle = includeChapterNumbers
      ? `Chapter ${chapterIndex + 1}: ${chapter.title}`
      : chapter.title

    if (yPosition + 60 > pageHeight - margin) {
      doc.addPage()
      yPosition = margin
    }

    yPosition = addText(chapterTitle, margin, yPosition, contentWidth)
    yPosition += 20

    // Chapter summary (if exists)
    if (chapter.summary) {
      doc.setFontSize(fontSize)
      doc.setFont('helvetica', 'italic')
      yPosition = addText(chapter.summary, margin, yPosition, contentWidth)
      yPosition += 10
    }

    // Scenes
    chapter.scenes.forEach((scene, sceneIndex) => {
      // Scene separator
      if (includeSceneSeparators && sceneIndex > 0) {
        if (yPosition + 40 > pageHeight - margin) {
          doc.addPage()
          yPosition = margin
        }
        doc.setFontSize(fontSize)
        doc.setFont('helvetica', 'normal')
        yPosition = addText('* * *', margin, yPosition + 20, contentWidth, 'center')
        yPosition += 20
      }

      // Parse HTML content to plain text
      const textContent = stripHtml(scene.content)

      // Split into paragraphs
      const paragraphs = textContent.split('\n\n').filter(p => p.trim())

      doc.setFontSize(fontSize)
      doc.setFont('helvetica', 'normal')

      paragraphs.forEach(para => {
        if (yPosition + fontSize * lineSpacing * 3 > pageHeight - margin) {
          doc.addPage()
          yPosition = margin
        }

        // Add paragraph with first-line indent
        const indent = 36 // 0.5 inch
        const firstLine = para.substring(0, para.indexOf(' ', 40))
        const restOfPara = para.substring(firstLine.length).trim()

        // First line with indent
        if (firstLine) {
          doc.text(firstLine, margin + indent, yPosition)
          yPosition += fontSize * lineSpacing
        }

        // Rest of paragraph
        if (restOfPara) {
          const lines = doc.splitTextToSize(restOfPara, contentWidth)
          lines.forEach((line: string) => {
            if (yPosition > pageHeight - margin) {
              doc.addPage()
              yPosition = margin
            }
            doc.text(line, margin, yPosition)
            yPosition += fontSize * lineSpacing
          })
        }

        yPosition += fontSize * lineSpacing * 0.5 // Extra space between paragraphs
      })
    })

    // Page break after each chapter (except last)
    if (chapterIndex < chapters.length - 1) {
      doc.addPage()
      yPosition = margin
    }
  })

  // Save the PDF
  const fileName = `${manuscript.title.replace(/[^a-z0-9]/gi, '_')}.pdf`
  doc.save(fileName)
}

// Helper function to strip HTML tags
function stripHtml(html: string): string {
  if (typeof window !== 'undefined') {
    const tmp = document.createElement('DIV')
    tmp.innerHTML = html
    return tmp.textContent || tmp.innerText || ''
  }

  // Fallback for server-side
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
}
