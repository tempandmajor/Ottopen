/**
 * EPUB Export Service - Server Only
 * This file contains Node.js-specific code and should only be imported in API routes
 */

import type { Script, ScriptElement } from '@/src/types/script-editor'
import type { ExportOptions } from './export-service'

/**
 * Escape HTML special characters
 */
function escapeHTML(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * Generate EPUB content
 * This function uses Node.js-specific modules and should only be called server-side
 */
export async function generateEPUB(
  script: Script,
  chapters: ScriptElement[][],
  options: ExportOptions
): Promise<Buffer> {
  // Dynamic imports to ensure this only runs on server
  const Epub = (await import('epub-gen')).default
  const fs = await import('fs')
  const path = await import('path')
  const os = await import('os')

  // Create a temporary file path
  const tmpDir = os.tmpdir()
  const outputPath = path.join(tmpDir, `${script.id || 'book'}_${Date.now()}.epub`)

  const epubOptions = {
    title: script.title,
    author: options.metadata?.author || 'Unknown Author',
    publisher: options.metadata?.copyright || 'Self-Published',
    lang: 'en',
    output: outputPath,
    content: chapters.map((chapterElements, index) => {
      const chapterTitle =
        chapterElements.find(el => el.element_type === 'chapter_title')?.content ||
        `Chapter ${index + 1}`
      const chapterContent = chapterElements
        .filter(el => el.element_type !== 'chapter_title')
        .map(el => {
          switch (el.element_type) {
            case 'chapter_subtitle':
              return `<h2>${escapeHTML(el.content)}</h2>`
            case 'heading_1':
              return `<h3>${escapeHTML(el.content)}</h3>`
            case 'heading_2':
              return `<h4>${escapeHTML(el.content)}</h4>`
            case 'heading_3':
              return `<h5>${escapeHTML(el.content)}</h5>`
            case 'block_quote':
              return `<blockquote>${escapeHTML(el.content)}</blockquote>`
            case 'bullet_list':
              return `<ul><li>${escapeHTML(el.content)}</li></ul>`
            case 'numbered_list':
              return `<ol><li>${escapeHTML(el.content)}</li></ol>`
            case 'footnote':
              return `<aside>${escapeHTML(el.content)}</aside>`
            case 'paragraph':
            default:
              return `<p>${escapeHTML(el.content)}</p>`
          }
        })
        .join('\n')

      return {
        title: chapterTitle,
        data: chapterContent,
      }
    }),
  }

  // Generate EPUB - epub-gen writes to file and returns Promise<void>
  await new Epub(epubOptions, outputPath).promise

  // Read the generated file
  const buffer = fs.readFileSync(outputPath)

  // Clean up temporary file
  try {
    fs.unlinkSync(outputPath)
  } catch (err) {
    // Ignore cleanup errors
  }

  return buffer
}
