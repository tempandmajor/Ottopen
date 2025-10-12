'use client'

import { Button } from '@/src/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/src/components/ui/dropdown-menu'
import { Download, FileText, File, Code, Archive } from 'lucide-react'
import { useState } from 'react'
import { jsPDF } from 'jspdf'

interface ExportMenuProps {
  content: string
  title: string
  author?: string
}

export function ExportMenu({ content, title, author }: ExportMenuProps) {
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async (format: 'pdf' | 'html' | 'markdown' | 'docx') => {
    setIsExporting(true)

    try {
      switch (format) {
        case 'pdf':
          await exportToPDF()
          break
        case 'html':
          exportToHTML()
          break
        case 'markdown':
          exportToMarkdown()
          break
        case 'docx':
          exportToDOCX()
          break
      }
    } catch (error) {
      console.error('Export error:', error)
      alert(`Failed to export to ${format.toUpperCase()}`)
    } finally {
      setIsExporting(false)
    }
  }

  const exportToPDF = async () => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    })

    // Set metadata
    doc.setProperties({
      title,
      author: author || '',
      creator: 'Ottopen Editor',
    })

    // Convert HTML to text for PDF
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = content
    const textContent = tempDiv.textContent || ''

    // Add title
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.text(title, 20, 20)

    // Add author
    if (author) {
      doc.setFontSize(12)
      doc.setFont('helvetica', 'normal')
      doc.text(`by ${author}`, 20, 30)
    }

    // Add content
    doc.setFontSize(11)
    const lines = doc.splitTextToSize(textContent, 170)
    let y = author ? 40 : 30

    lines.forEach((line: string) => {
      if (y > 280) {
        doc.addPage()
        y = 20
      }
      doc.text(line, 20, y)
      y += 7
    })

    doc.save(`${title}.pdf`)
  }

  const exportToHTML = () => {
    const fullHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  ${author ? `<meta name="author" content="${author}">` : ''}
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem;
      color: #333;
    }
    h1 { font-size: 2.5rem; margin-bottom: 0.5rem; }
    h2 { font-size: 2rem; margin-top: 2rem; }
    h3 { font-size: 1.5rem; margin-top: 1.5rem; }
    p { margin: 1rem 0; }
    blockquote {
      border-left: 4px solid #ddd;
      padding-left: 1rem;
      margin-left: 0;
      font-style: italic;
      color: #666;
    }
    code {
      background: #f5f5f5;
      padding: 0.125rem 0.25rem;
      border-radius: 3px;
      font-family: 'Monaco', 'Courier New', monospace;
    }
  </style>
</head>
<body>
  <h1>${title}</h1>
  ${author ? `<p style="font-style: italic; color: #666;">by ${author}</p>` : ''}
  ${content}
</body>
</html>`

    downloadFile(fullHTML, `${title}.html`, 'text/html')
  }

  const exportToMarkdown = () => {
    let markdown = `# ${title}\n\n`
    if (author) markdown += `*by ${author}*\n\n`

    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = content

    // Process headings
    const headings = tempDiv.querySelectorAll('h1, h2, h3, h4, h5, h6')
    headings.forEach(heading => {
      const level = parseInt(heading.tagName[1])
      const text = heading.textContent || ''
      const prefix = '#'.repeat(level)
      const replacement = `\n${prefix} ${text}\n\n`
      heading.replaceWith(document.createTextNode(replacement))
    })

    // Process paragraphs
    const paragraphs = tempDiv.querySelectorAll('p')
    paragraphs.forEach(p => {
      const text = p.textContent || ''
      p.replaceWith(document.createTextNode(`${text}\n\n`))
    })

    // Process bold
    const bold = tempDiv.querySelectorAll('strong, b')
    bold.forEach(el => {
      const text = el.textContent || ''
      el.replaceWith(document.createTextNode(`**${text}**`))
    })

    // Process italic
    const italic = tempDiv.querySelectorAll('em, i')
    italic.forEach(el => {
      const text = el.textContent || ''
      el.replaceWith(document.createTextNode(`*${text}*`))
    })

    // Process lists
    const ulItems = tempDiv.querySelectorAll('ul > li')
    ulItems.forEach(li => {
      const text = li.textContent || ''
      li.replaceWith(document.createTextNode(`- ${text}\n`))
    })

    const olItems = tempDiv.querySelectorAll('ol > li')
    olItems.forEach((li, index) => {
      const text = li.textContent || ''
      li.replaceWith(document.createTextNode(`${index + 1}. ${text}\n`))
    })

    // Process blockquotes
    const blockquotes = tempDiv.querySelectorAll('blockquote')
    blockquotes.forEach(quote => {
      const text = quote.textContent || ''
      const lines = text
        .split('\n')
        .map(line => `> ${line}`)
        .join('\n')
      quote.replaceWith(document.createTextNode(`${lines}\n\n`))
    })

    markdown += tempDiv.textContent || ''
    downloadFile(markdown, `${title}.md`, 'text/markdown')
  }

  const exportToDOCX = () => {
    const wordHTML = `<!DOCTYPE html>
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word'>
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <style>
    body {
      font-family: 'Calibri', sans-serif;
      font-size: 11pt;
      line-height: 1.5;
      margin: 1in;
    }
    h1 { font-size: 24pt; margin-bottom: 0.5em; }
    h2 { font-size: 18pt; margin-top: 1em; }
    h3 { font-size: 14pt; margin-top: 0.75em; }
    p { margin: 0.5em 0; }
  </style>
</head>
<body>
  <h1>${title}</h1>
  ${author ? `<p style="font-style: italic; color: #666;">by ${author}</p>` : ''}
  ${content}
</body>
</html>`

    downloadFile(
      wordHTML,
      `${title}.doc`,
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    )
  }

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={isExporting}>
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Export As</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => handleExport('pdf')}>
          <FileText className="mr-2 h-4 w-4" />
          PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('docx')}>
          <File className="mr-2 h-4 w-4" />
          Word Document
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('markdown')}>
          <Code className="mr-2 h-4 w-4" />
          Markdown
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('html')}>
          <Archive className="mr-2 h-4 w-4" />
          HTML
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
