'use client'

import { useState } from 'react'
import { Manuscript, Chapter, Scene } from '@/src/types/ai-editor'
import { Button } from '@/src/components/ui/button'
import { Label } from '@/src/components/ui/label'
import { Checkbox } from '@/src/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/src/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/src/components/ui/select'
import { Download, FileText, File } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { exportToDocx } from '@/src/lib/export/docx-export'
import { exportToPdf } from '@/src/lib/export/pdf-export'

interface ExportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  manuscript: Manuscript
  chapters: (Chapter & { scenes: Scene[] })[]
}

export function ExportDialog({ open, onOpenChange, manuscript, chapters }: ExportDialogProps) {
  const [format, setFormat] = useState<'docx' | 'pdf'>('docx')
  const [includeChapterNumbers, setIncludeChapterNumbers] = useState(true)
  const [includeSceneSeparators, setIncludeSceneSeparators] = useState(true)
  const [exporting, setExporting] = useState(false)

  const handleExport = async () => {
    try {
      setExporting(true)

      const options = {
        includeChapterNumbers,
        includeSceneSeparators,
      }

      if (format === 'docx') {
        await exportToDocx(manuscript, chapters, options)
        toast.success('Exported to DOCX successfully!')
      } else {
        await exportToPdf(manuscript, chapters, options)
        toast.success('Exported to PDF successfully!')
      }

      onOpenChange(false)
    } catch (error) {
      console.error('Export failed:', error)
      toast.error('Failed to export manuscript')
    } finally {
      setExporting(false)
    }
  }

  const totalWords = chapters.reduce(
    (sum, chapter) => sum + chapter.scenes.reduce((s, scene) => s + (scene.word_count || 0), 0),
    0
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Export Manuscript</DialogTitle>
          <DialogDescription>
            Export &quot;{manuscript.title}&quot; to a document format
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Format Selection */}
          <div className="space-y-2">
            <Label>Export Format</Label>
            <Select value={format} onValueChange={(v: any) => setFormat(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="docx">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span>Microsoft Word (.docx)</span>
                  </div>
                </SelectItem>
                <SelectItem value="pdf">
                  <div className="flex items-center gap-2">
                    <File className="h-4 w-4" />
                    <span>PDF Document (.pdf)</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Options */}
          <div className="space-y-3">
            <Label>Export Options</Label>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="chapter-numbers"
                checked={includeChapterNumbers}
                onCheckedChange={checked => setIncludeChapterNumbers(checked as boolean)}
              />
              <Label htmlFor="chapter-numbers" className="font-normal cursor-pointer">
                Include chapter numbers (e.g., &quot;Chapter 1:&quot;)
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="scene-separators"
                checked={includeSceneSeparators}
                onCheckedChange={checked => setIncludeSceneSeparators(checked as boolean)}
              />
              <Label htmlFor="scene-separators" className="font-normal cursor-pointer">
                Add scene separators (***) between scenes
              </Label>
            </div>
          </div>

          {/* Preview Info */}
          <div className="p-3 bg-muted rounded-lg space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Chapters:</span>
              <span className="font-medium">{chapters.length}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total Scenes:</span>
              <span className="font-medium">
                {chapters.reduce((sum, c) => sum + c.scenes.length, 0)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total Words:</span>
              <span className="font-medium">{totalWords.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={exporting}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={exporting}>
            <Download className="h-4 w-4 mr-2" />
            {exporting ? 'Exporting...' : `Export to ${format.toUpperCase()}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
