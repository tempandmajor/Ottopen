/**
 * Export manuscript to plain text format
 */

import type { Manuscript, Chapter, Scene } from '@/src/types/ai-editor'

interface ExportOptions {
  includeChapterNumbers?: boolean
  includeSceneSeparators?: boolean
}

export async function exportToPlainText(
  manuscript: Manuscript,
  chapters: (Chapter & { scenes: Scene[] })[],
  options: ExportOptions = {}
): Promise<void> {
  const { includeChapterNumbers = true, includeSceneSeparators = true } = options

  let text = ''

  // Title
  text += `${manuscript.title.toUpperCase()}\n`
  text += `${'='.repeat(manuscript.title.length)}\n\n`

  // Chapters and Scenes
  chapters.forEach((chapter, chapterIdx) => {
    // Chapter heading
    if (includeChapterNumbers) {
      text += `CHAPTER ${chapterIdx + 1}: ${chapter.title.toUpperCase()}\n\n`
    } else {
      text += `${chapter.title.toUpperCase()}\n\n`
    }

    // Scenes
    chapter.scenes.forEach((scene, sceneIdx) => {
      // Scene content (strip HTML tags)
      const plainText = scene.content
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')

      text += `${plainText}\n\n`

      // Scene separator
      if (includeSceneSeparators && sceneIdx < chapter.scenes.length - 1) {
        text += `* * *\n\n`
      }
    })

    text += `\n\n`
  })

  // Create and download file
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${manuscript.title.replace(/[^a-z0-9]/gi, '_')}.txt`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
