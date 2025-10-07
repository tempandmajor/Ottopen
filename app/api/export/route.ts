import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/server/auth'
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, PageBreak } from 'docx'
import { jsPDF } from 'jspdf'
import { createServerSupabaseClient } from '@/src/lib/supabase-server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs' // Force Node.js runtime for epub-gen

interface ExportRequest {
  manuscriptId: string
  format: 'docx' | 'pdf' | 'epub'
  includeChapters?: string[] // Chapter IDs to include
  metadata?: {
    title?: string
    author?: string
    description?: string
    language?: string
  }
}

async function handleExport(request: NextRequest) {
  try {
    const { user } = await getServerUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: ExportRequest = await request.json()

    if (!body.manuscriptId || !body.format) {
      return NextResponse.json({ error: 'Manuscript ID and format are required' }, { status: 400 })
    }

    const supabase = createServerSupabaseClient()

    // Fetch manuscript data
    const { data: manuscript, error: manuscriptError } = await supabase
      .from('manuscripts')
      .select('*')
      .eq('id', body.manuscriptId)
      .eq('user_id', user.id)
      .single()

    if (manuscriptError || !manuscript) {
      return NextResponse.json({ error: 'Manuscript not found' }, { status: 404 })
    }

    // Fetch chapters
    let chaptersQuery = supabase
      .from('chapters')
      .select('*')
      .eq('manuscript_id', body.manuscriptId)
      .order('order_index', { ascending: true })

    if (body.includeChapters && body.includeChapters.length > 0) {
      chaptersQuery = chaptersQuery.in('id', body.includeChapters)
    }

    const { data: chapters, error: chaptersError } = await chaptersQuery

    if (chaptersError) {
      return NextResponse.json({ error: 'Failed to fetch chapters' }, { status: 500 })
    }

    const metadata = {
      title: body.metadata?.title || manuscript.title,
      author: body.metadata?.author || user.email || 'Unknown Author',
      description: body.metadata?.description || '',
      language: body.metadata?.language || 'en',
    }

    let exportData: Buffer
    let mimeType: string
    let filename: string

    switch (body.format) {
      case 'docx':
        exportData = await exportToDocx(manuscript, chapters || [], metadata)
        mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        filename = `${sanitizeFilename(metadata.title)}.docx`
        break

      case 'pdf':
        exportData = await exportToPdf(manuscript, chapters || [], metadata)
        mimeType = 'application/pdf'
        filename = `${sanitizeFilename(metadata.title)}.pdf`
        break

      case 'epub':
        exportData = await exportToEpub(manuscript, chapters || [], metadata)
        mimeType = 'application/epub+zip'
        filename = `${sanitizeFilename(metadata.title)}.epub`
        break

      default:
        return NextResponse.json({ error: 'Invalid export format' }, { status: 400 })
    }

    return new NextResponse(exportData, {
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': exportData.length.toString(),
      },
    })
  } catch (error: any) {
    console.error('Export Error:', error)
    return NextResponse.json({ error: error.message || 'Export failed' }, { status: 500 })
  }
}

async function exportToDocx(manuscript: any, chapters: any[], metadata: any): Promise<Buffer> {
  const children: any[] = []

  // Title page
  children.push(
    new Paragraph({
      text: metadata.title,
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    }),
    new Paragraph({
      text: `by ${metadata.author}`,
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    }),
    new Paragraph({
      children: [new PageBreak()],
    })
  )

  // Chapters
  for (const chapter of chapters) {
    // Chapter title
    children.push(
      new Paragraph({
        text: chapter.title,
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 400, after: 200 },
      })
    )

    // Chapter content (parse HTML to plain text)
    const plainText = stripHtml(chapter.content || '')
    const paragraphs = plainText.split('\n\n').filter(p => p.trim())

    for (const para of paragraphs) {
      children.push(
        new Paragraph({
          children: [new TextRun(para)],
          spacing: { after: 200 },
          indent: { firstLine: 720 }, // 0.5 inch indent
        })
      )
    }

    // Page break after chapter
    children.push(
      new Paragraph({
        children: [new PageBreak()],
      })
    )
  }

  const doc = new Document({
    sections: [
      {
        properties: {},
        children,
      },
    ],
  })

  return await Packer.toBuffer(doc)
}

async function exportToPdf(manuscript: any, chapters: any[], metadata: any): Promise<Buffer> {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  let currentY = 40
  const lineHeight = 7
  const pageHeight = 297
  const margin = 20
  const maxWidth = 170

  // Title page
  pdf.setFontSize(24)
  pdf.text(metadata.title, 105, currentY, { align: 'center' })
  currentY += 20

  pdf.setFontSize(16)
  pdf.text(`by ${metadata.author}`, 105, currentY, { align: 'center' })

  pdf.addPage()
  currentY = 30

  // Chapters
  for (const chapter of chapters) {
    // Chapter title
    pdf.setFontSize(18)
    pdf.setFont('helvetica', 'bold')
    pdf.text(chapter.title, margin, currentY)
    currentY += 15

    // Chapter content
    pdf.setFontSize(12)
    pdf.setFont('helvetica', 'normal')

    const plainText = stripHtml(chapter.content || '')
    const paragraphs = plainText.split('\n\n').filter(p => p.trim())

    for (const para of paragraphs) {
      const lines = pdf.splitTextToSize(para, maxWidth)

      for (const line of lines) {
        if (currentY > pageHeight - margin) {
          pdf.addPage()
          currentY = 30
        }
        pdf.text(line, margin + 10, currentY) // Indent paragraphs
        currentY += lineHeight
      }

      currentY += 5 // Space between paragraphs
    }

    // Start new page for next chapter
    if (chapters.indexOf(chapter) < chapters.length - 1) {
      pdf.addPage()
      currentY = 30
    }
  }

  return Buffer.from(pdf.output('arraybuffer'))
}

async function exportToEpub(manuscript: any, chapters: any[], metadata: any): Promise<Buffer> {
  // Dynamic import to prevent epub-gen from being bundled in client code
  const Epub = (await import('epub-gen')).default

  const content = chapters.map(chapter => ({
    title: chapter.title,
    data: `<h2>${chapter.title}</h2>${chapter.content || '<p>No content</p>'}`,
  }))

  const options = {
    title: metadata.title,
    author: metadata.author,
    description: metadata.description,
    lang: metadata.language,
    content,
  }

  return new Promise<Buffer>((resolve, reject) => {
    new Epub(options, '/tmp/temp.epub').promise.then(
      (buffer: any) => {
        resolve(buffer as Buffer)
      },
      (error: any) => {
        reject(error)
      }
    )
  })
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .trim()
}

function sanitizeFilename(filename: string): string {
  return filename.replace(/[^a-z0-9]/gi, '_').toLowerCase()
}

export const POST = handleExport
