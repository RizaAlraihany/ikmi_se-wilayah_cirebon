'use client'

import { FileUp, Paperclip, X } from 'lucide-react'
import { useId, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

type FileUploadProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> & {
  label: string
  description?: string
  error?: string
  maxSizeBytes?: number
  onFilesChange?: (files: File[]) => void
  validateFiles?: (files: File[]) => string | null
}

function formatBytes(size: number) {
  if (size < 1024 * 1024) return `${Math.ceil(size / 1024)} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

export function FileUpload({
  label,
  description,
  error,
  maxSizeBytes,
  onFilesChange,
  validateFiles,
  id,
  multiple,
  className,
  disabled,
  ...props
}: FileUploadProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const inputRef = useRef<HTMLInputElement>(null)
  const [files, setFiles] = useState<File[]>([])
  const [localError, setLocalError] = useState<string | null>(null)

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const nextFiles = Array.from(event.target.files ?? [])
    const tooLarge = maxSizeBytes ? nextFiles.find((file) => file.size > maxSizeBytes) : undefined

    if (tooLarge) {
      setFiles([])
      setLocalError(`${tooLarge.name} melebihi batas ${formatBytes(maxSizeBytes ?? 0)}.`)
      event.target.value = ''
      onFilesChange?.([])
      return
    }

    const validationError = validateFiles?.(nextFiles)
    if (validationError) {
      setFiles([])
      setLocalError(validationError)
      event.target.value = ''
      onFilesChange?.([])
      return
    }

    setLocalError(null)
    setFiles(nextFiles)
    onFilesChange?.(nextFiles)
  }

  const message = error ?? localError

  function clearFiles() {
    setFiles([])
    setLocalError(null)
    if (inputRef.current) inputRef.current.value = ''
    onFilesChange?.([])
  }

  return (
    <div className={cn('space-y-2', className)}>
      <label htmlFor={inputId} className="block text-sm font-semibold text-primary">
        {label}
      </label>
      {description ? <p className="text-sm leading-6 text-text-secondary">{description}</p> : null}
      <label
        htmlFor={inputId}
        className={cn(
          'flex min-h-24 cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed border-border bg-surface px-4 py-4 text-center transition hover:border-accent/60 hover:bg-accent/5',
          disabled && 'cursor-not-allowed opacity-60',
          message && 'border-danger/50 bg-danger/5',
        )}
      >
        <FileUp className="h-6 w-6 text-accent" aria-hidden="true" />
        <span className="text-sm font-semibold text-primary">Pilih file</span>
        <span className="text-xs leading-5 text-text-secondary">Pilih file dari perangkat Anda.</span>
      </label>
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        multiple={multiple}
        disabled={disabled}
        onChange={handleChange}
        className="sr-only"
        aria-invalid={Boolean(message)}
        aria-describedby={message ? `${inputId}-error` : undefined}
        {...props}
      />
      {files.length ? (
        <ul className="space-y-2" aria-label="File terpilih">
          {files.map((file) => (
            <li key={`${file.name}-${file.lastModified}`} className="ikmi-glass-surface flex min-h-12 items-center gap-3 rounded-md px-3 py-2 text-sm" data-glass="subtle">
              <Paperclip className="h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
              <span className="min-w-0 flex-1 truncate font-medium text-primary">{file.name}</span>
              <span className="shrink-0 text-xs text-text-secondary">{formatBytes(file.size)}</span>
              <button type="button" onClick={clearFiles} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-text-muted hover:bg-surface-alt hover:text-danger-foreground" aria-label={`Hapus ${file.name}`}>
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {message ? <p id={`${inputId}-error`} className="text-sm font-medium text-danger-foreground">{message}</p> : null}
    </div>
  )
}
