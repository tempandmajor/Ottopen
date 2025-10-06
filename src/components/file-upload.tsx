'use client'

import { useState, useCallback } from 'react'
import { Upload, X, File, CheckCircle, Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/src/components/ui/button'
import { Progress } from '@/src/components/ui/progress'
import { cn } from '@/src/lib/utils'
import { supabase } from '@/src/lib/supabase'
import { toast } from 'react-hot-toast'

interface FileUploadProps {
  onUploadComplete: (url: string, file: File) => void
  onRemove?: () => void
  acceptedTypes?: string[]
  maxSizeMB?: number
  label?: string
  description?: string
  bucket?: string
  folder?: string
  existingFile?: {
    name: string
    url: string
  }
}

export function FileUpload({
  onUploadComplete,
  onRemove,
  acceptedTypes = ['.pdf', '.doc', '.docx'],
  maxSizeMB = 10,
  label = 'Upload File',
  description = 'PDF or DOCX, max 10MB',
  bucket = 'manuscripts',
  folder = '',
  existingFile,
}: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(existingFile?.url || null)
  const [error, setError] = useState<string | null>(null)

  const validateFile = (file: File): string | null => {
    // Check file type
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()
    if (!acceptedTypes.some(type => type.toLowerCase() === fileExtension)) {
      return `Invalid file type. Please upload: ${acceptedTypes.join(', ')}`
    }

    // Check file size
    const fileSizeMB = file.size / (1024 * 1024)
    if (fileSizeMB > maxSizeMB) {
      return `File size must be less than ${maxSizeMB}MB (current: ${fileSizeMB.toFixed(2)}MB)`
    }

    return null
  }

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0]
      if (!selectedFile) return

      // Validate file
      const validationError = validateFile(selectedFile)
      if (validationError) {
        setError(validationError)
        toast.error(validationError)
        return
      }

      setFile(selectedFile)
      setError(null)
      setUploadProgress(0)

      // Auto-upload
      await uploadFile(selectedFile)
    },
    [maxSizeMB, acceptedTypes]
  )

  const uploadFile = async (fileToUpload: File) => {
    setUploading(true)
    setError(null)

    try {
      // Generate unique file name
      const timestamp = Date.now()
      const sanitizedName = fileToUpload.name.replace(/[^a-zA-Z0-9.-]/g, '_')
      const fileName = `${folder}/${timestamp}_${sanitizedName}`.replace('//', '/')

      // Upload to Supabase Storage
      const { data, error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, fileToUpload, {
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) {
        throw uploadError
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from(bucket).getPublicUrl(data.path)

      setUploadedUrl(publicUrl)
      setUploadProgress(100)
      onUploadComplete(publicUrl, fileToUpload)
      toast.success('File uploaded successfully')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload file'
      setError(errorMessage)
      toast.error(errorMessage)
      console.error('Upload error:', err)
    } finally {
      setUploading(false)
    }
  }

  const handleRemove = async () => {
    if (uploadedUrl && file) {
      try {
        // Extract file path from public URL
        const urlParts = uploadedUrl.split(`${bucket}/`)
        if (urlParts.length > 1) {
          const filePath = urlParts[1]
          await supabase.storage.from(bucket).remove([filePath])
        }
      } catch (err) {
        console.error('Error removing file:', err)
      }
    }

    setFile(null)
    setUploadedUrl(null)
    setUploadProgress(0)
    setError(null)
    onRemove?.()
  }

  return (
    <div className="space-y-2">
      {label && <label className="text-sm font-medium">{label}</label>}

      <div
        className={cn(
          'border-2 border-dashed rounded-lg p-6 transition-colors',
          error
            ? 'border-red-300 bg-red-50 dark:border-red-900 dark:bg-red-950/20'
            : uploadedUrl
              ? 'border-green-300 bg-green-50 dark:border-green-900 dark:bg-green-950/20'
              : 'border-muted hover:border-gray-400'
        )}
      >
        {uploadedUrl ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium">
                  {file?.name || existingFile?.name || 'File uploaded'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {file && `${(file.size / 1024 / 1024).toFixed(2)} MB`}
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={handleRemove}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <>
            <input
              type="file"
              accept={acceptedTypes.join(',')}
              onChange={handleFileChange}
              className="hidden"
              id={`file-upload-${label}`}
              disabled={uploading}
            />
            <label
              htmlFor={`file-upload-${label}`}
              className={cn(
                'flex flex-col items-center cursor-pointer',
                uploading && 'cursor-not-allowed opacity-50'
              )}
            >
              {uploading ? (
                <>
                  <Loader2 className="h-10 w-10 text-primary animate-spin mb-3" />
                  <p className="text-sm font-medium mb-1">Uploading...</p>
                  <Progress value={uploadProgress} className="w-full max-w-xs mb-2" />
                  <p className="text-xs text-muted-foreground">{uploadProgress}%</p>
                </>
              ) : (
                <>
                  <Upload className="h-10 w-10 text-muted-foreground mb-3" />
                  <p className="text-sm font-medium mb-1">Click to upload or drag and drop</p>
                  <p className="text-xs text-muted-foreground">{description}</p>
                </>
              )}
            </label>
          </>
        )}

        {error && (
          <div className="flex items-center space-x-2 mt-3 text-red-600">
            <AlertCircle className="h-4 w-4" />
            <p className="text-xs">{error}</p>
          </div>
        )}
      </div>
    </div>
  )
}
