/**
 * Export manuscript to Markdown format
 */

import type { Manuscript, Chapter, Scene } from '@/src/types/ai-editor'

interface ExportOptions {
  includeChapterNumbers?: boolean
  includeSceneSeparators?: boolean
  includeMetadata?: boolean
}

export async function exportToMarkdown(
  manuscript: Manuscript,
  chapters: (Chapter & { scenes: Scene[] })[],
  options: ExportOptions = {}
): Promise<void> {
  const {
    includeChapterNumbers = true,
    includeSceneSeparators = true,
    includeMetadata = true,
  } = options

  let markdown = ''

  // Metadata
  if (includeMetadata) {
    markdown += `---\n`
    markdown += `title: ${manuscript.title}\n`
    if (manuscript.genre) markdown += `genre: ${manuscript.genre}\n`
    if (manuscript.target_word_count) {
      markdown += `target_word_count: ${manuscript.target_word_count}\n`
    }
    markdown += `word_count: ${manuscript.current_word_count}\n`
    markdown += `status: ${manuscript.status}\n`
    markdown += `created: ${new Date(manuscript.created_at).toLocaleDateString()}\n`
    markdown += `---\n\n`
  }

  // Title
  markdown += `# ${manuscript.title}\n\n`

  // Chapters and Scenes
  chapters.forEach((chapter, chapterIdx) => {
    // Chapter heading
    if (includeChapterNumbers) {
      markdown += `## Chapter ${chapterIdx + 1}: ${chapter.title}\n\n`
    } else {
      markdown += `## ${chapter.title}\n\n`
    }

    // Scenes
    chapter.scenes.forEach((scene, sceneIdx) => {
      // Scene heading (commented out by default)
      markdown += `<!-- Scene: ${scene.title} -->\n\n`

      // Scene content (strip HTML tags)
      const plainText = scene.content.replace(/<[^>]*>/g, '')
      markdown += `${plainText}\n\n`

      // Scene separator
      if (includeSceneSeparators && sceneIdx < chapter.scenes.length - 1) {
        markdown += `***\n\n`
      }
    })

    markdown += `\n`
  })

  // Create and download file
  const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${manuscript.title.replace(/[^a-z0-9]/gi, '_')}.md`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
