import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx'
import { saveAs } from 'file-saver'
import type { Manuscript, Chapter, Scene } from '@/src/types/ai-editor'

interface ExportOptions {
  includeChapterNumbers?: boolean
  includeSceneSeparators?: boolean
  fontSize?: number
  fontFamily?: string
}

export async function exportToDocx(
  manuscript: Manuscript,
  chapters: (Chapter & { scenes: Scene[] })[],
  options: ExportOptions = {}
) {
  const {
    includeChapterNumbers = true,
    includeSceneSeparators = true,
    fontSize = 24, // 12pt in half-points
    fontFamily = 'Times New Roman',
  } = options

  const children: Paragraph[] = []

  // Title Page
  children.push(
    new Paragraph({
      text: manuscript.title,
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    })
  )

  if (manuscript.subtitle) {
    children.push(
      new Paragraph({
        text: manuscript.subtitle,
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
      })
    )
  }

  children.push(
    new Paragraph({
      text: 'by Author',
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    })
  )

  // Add page break after title page
  children.push(
    new Paragraph({
      text: '',
      pageBreakBefore: true,
    })
  )

  // Chapters and Scenes
  chapters.forEach((chapter, chapterIndex) => {
    // Chapter Heading
    const chapterTitle = includeChapterNumbers
      ? `Chapter ${chapterIndex + 1}: ${chapter.title}`
      : chapter.title

    children.push(
      new Paragraph({
        text: chapterTitle,
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 },
      })
    )

    // Chapter Summary (if exists)
    if (chapter.summary) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: chapter.summary,
              italics: true,
              size: fontSize,
              font: fontFamily,
            }),
          ],
          spacing: { after: 200 },
        })
      )
    }

    // Scenes
    chapter.scenes.forEach((scene, sceneIndex) => {
      // Scene separator (like "* * *")
      if (includeSceneSeparators && sceneIndex > 0) {
        children.push(
          new Paragraph({
            text: '* * *',
            alignment: AlignmentType.CENTER,
            spacing: { before: 200, after: 200 },
          })
        )
      }

      // Parse HTML content to plain text
      const textContent = stripHtml(scene.content)

      // Split into paragraphs
      const paragraphs = textContent.split('\n\n').filter(p => p.trim())

      paragraphs.forEach(para => {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: para.trim(),
                size: fontSize,
                font: fontFamily,
              }),
            ],
            spacing: { after: 200 },
          })
        )
      })
    })

    // Page break after each chapter (except last)
    if (chapterIndex < chapters.length - 1) {
      children.push(
        new Paragraph({
          text: '',
          pageBreakBefore: true,
        })
      )
    }
  })

  // Create document
  const doc = new Document({
    sections: [
      {
        properties: {},
        children,
      },
    ],
  })

  // Generate and download
  const blob = await Packer.toBlob(doc)
  const fileName = `${manuscript.title.replace(/[^a-z0-9]/gi, '_')}.docx`
  saveAs(blob, fileName)
}

// Helper function to strip HTML tags
function stripHtml(html: string): string {
  // Create a temporary div to parse HTML
  if (typeof window !== 'undefined') {
    const tmp = document.createElement('DIV')
    tmp.innerHTML = html
    return tmp.textContent || tmp.innerText || ''
  }

  // Fallback for server-side: simple regex-based stripping
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
