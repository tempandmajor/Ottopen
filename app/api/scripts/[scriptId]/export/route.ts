import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/server/auth'
import { ScriptService, ElementService } from '@/src/lib/script-service'
import { ExportService, type ExportFormat } from '@/src/lib/export-service'

// Force Node.js runtime for file system operations (epub-gen)
export const runtime = 'nodejs'

// GET /api/scripts/[scriptId]/export?format=pdf - Export script to various formats
export async function GET(request: NextRequest, { params }: { params: { scriptId: string } }) {
  try {
    const { user } = await getServerUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const script = await ScriptService.getById(params.scriptId)
    if (!script || script.user_id !== user.id) {
      return NextResponse.json({ error: 'Script not found' }, { status: 404 })
    }

    const searchParams = request.nextUrl.searchParams
    const format = (searchParams.get('format') || 'pdf') as ExportFormat
    const includeTitlePage = searchParams.get('title_page') === 'true'
    const includePageNumbers = searchParams.get('page_numbers') === 'true'
    const watermark = searchParams.get('watermark') || undefined

    const elements = await ElementService.getByScriptId(params.scriptId)

    const options = {
      format,
      include_title_page: includeTitlePage,
      include_page_numbers: includePageNumbers,
      watermark,
    }

    let blob: Blob
    let filename: string
    let mimeType: string

    switch (format) {
      case 'pdf':
        blob = await ExportService.exportToPDF(script, elements, options)
        filename = `${script.title}.pdf`
        mimeType = 'application/pdf'
        break
      case 'docx':
        blob = await ExportService.exportToWord(script, elements, options)
        filename = `${script.title}.docx`
        mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        break
      case 'epub':
        blob = await ExportService.exportToEPUB(script, elements, options)
        filename = `${script.title}.epub`
        mimeType = 'application/epub+zip'
        break
      case 'fdx':
        blob = await ExportService.exportToFinalDraft(script, elements, options)
        filename = `${script.title}.fdx`
        mimeType = 'application/xml'
        break
      case 'fountain':
        blob = await ExportService.exportToFountain(script, elements, options)
        filename = `${script.title}.fountain`
        mimeType = 'text/plain'
        break
      case 'txt':
        blob = await ExportService.exportToText(script, elements)
        filename = `${script.title}.txt`
        mimeType = 'text/plain'
        break
      default:
        return NextResponse.json({ error: 'Unsupported export format' }, { status: 400 })
    }

    const buffer = await blob.arrayBuffer()

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error: any) {
    console.error('Export error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
