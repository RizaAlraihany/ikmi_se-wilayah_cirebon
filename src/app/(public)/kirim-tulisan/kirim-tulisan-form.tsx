'use client'

import { useState } from 'react'
import { useForm, Controller, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { submitKaryaTulisSchema, SubmitKaryaTulisInput } from '@/features/kirim-tulisan/schemas'
import { hasMeaningfulArticleContent } from '@/features/blog/article-html-client'
import { discardWritingDocxImportAction, importWritingDocxAction, submitKaryaTulisAction, uploadWritingInlineImageAction } from '@/features/kirim-tulisan/actions'
import { ArticleEditor } from '@/components/ui/editor'
import { Input } from '@/components/ui/input'
import { Field } from '@/components/ui/field'
import { Button } from '@/components/ui/button'
import { ListboxSelect } from '@/components/ui/listbox-select'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { AlertCircle, CheckCircle2, UploadCloud, FileText, X } from 'lucide-react'

export function KirimTulisanForm() {
  const [globalError, setGlobalError] = useState<string>('')
  const [success, setSuccess] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [importWarnings, setImportWarnings] = useState<string[]>([])
  const [importSessionId, setImportSessionId] = useState<string | null>(null)
  const [importAssetManifest, setImportAssetManifest] = useState<string | null>(null)
  const [importedImageUrls, setImportedImageUrls] = useState<string[]>([])

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    reset,
    getValues,
    setValue,
  } = useForm<SubmitKaryaTulisInput>({
    resolver: zodResolver(submitKaryaTulisSchema),
    defaultValues: {
      category: 'Opini',
      authorStatus: 'Anggota',
      content: '',
    },
  })
  const authorStatus = useWatch({ control, name: 'authorStatus' })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return
    setFile(selectedFile)
    setGlobalError('')
  }

  const removeFile = async () => {
    const activeSessionId = importSessionId
    const activeManifest = importAssetManifest
    const currentContent = getValues('content') || ''
    const contentStillReferencesImportedImage = importedImageUrls.some((url) => currentContent.includes(url))

    setFile(null)
    setImportWarnings([])
    setGlobalError('')

    // Keep ownership state while the editor still points at a temporary image.
    // Removing that session here would leave the user with broken image URLs.
    if (!activeSessionId || !activeManifest || contentStillReferencesImportedImage) return

    setImportSessionId(null)
    setImportAssetManifest(null)
    setImportedImageUrls([])
    try {
      const result = await discardWritingDocxImportAction(activeSessionId, activeManifest)
      if (!result.success) console.error('Gambar impor DOCX yang dibuang belum dapat dibersihkan:', result.error)
    } catch (cleanupError) {
      // The temporary tag remains in place when cleanup is unavailable, so the
      // reference-aware stale sweep can safely retry it later.
      console.error('Gambar impor DOCX yang dibuang belum dapat dibersihkan:', cleanupError)
    }
  }

  const importDocx = async () => {
    if (!file || !file.name.toLowerCase().endsWith('.docx')) return
    const current = getValues()
    if (hasMeaningfulArticleContent(current.content) || current.title?.trim() || current.summary?.trim()) {
      if (!window.confirm('Impor DOCX akan mengganti judul, ringkasan, dan isi editor saat ini. Lanjutkan?')) return
    }
    setGlobalError('')
    setIsImporting(true)
    const formData = new FormData()
    formData.append('file', file)
    try {
      const result = await importWritingDocxAction(formData)
      if (!result.success || !('html' in result)) {
        setGlobalError(result.error || 'Dokumen DOCX belum dapat diimpor.')
        return
      }
      const previousImportSessionId = importSessionId
      const previousImportManifest = importAssetManifest
      setValue('title', result.title || '', { shouldDirty: true, shouldValidate: true })
      setValue('summary', result.excerpt || '', { shouldDirty: true, shouldValidate: true })
      setValue('content', result.html, { shouldDirty: true, shouldValidate: true })
      setImportWarnings(result.warnings)
      setImportSessionId(result.importSessionId)
      setImportAssetManifest(result.importAssetManifest)
      setImportedImageUrls(result.importedImages?.map((image) => image.url) || [])
      if (previousImportSessionId && previousImportManifest && previousImportSessionId !== result.importSessionId) {
        void discardWritingDocxImportAction(previousImportSessionId, previousImportManifest).then((cleanupResult) => {
          if (!cleanupResult.success) console.error('Gambar impor DOCX lama belum dapat dibersihkan:', cleanupResult.error)
        }).catch((cleanupError) => {
          console.error('Gambar impor DOCX lama belum dapat dibersihkan:', cleanupError)
        })
      }
    } catch {
      setGlobalError('Dokumen DOCX belum dapat diimpor. Anda tetap dapat mengirimkannya sebagai lampiran.')
    } finally {
      setIsImporting(false)
    }
  }

  const onSubmit = async (data: SubmitKaryaTulisInput) => {
    setGlobalError('')

    const formData = new FormData()
    formData.append('title', data.title)
    formData.append('category', data.category)
    if (data.topic) formData.append('topic', data.topic)
    if (data.summary) formData.append('summary', data.summary)
    formData.append('content', data.content || '')
    formData.append('authorName', data.authorName)
    formData.append('authorEmail', data.authorEmail)
    formData.append('authorWhatsapp', data.authorWhatsapp)
    formData.append('authorStatus', data.authorStatus)
    if (data.authorUnit) formData.append('authorUnit', data.authorUnit)
    formData.append('consent', data.consent)
    if (importSessionId) formData.append('docxImportSessionId', importSessionId)
    if (importAssetManifest) formData.append('docxImportManifest', importAssetManifest)
    if (file) formData.append('file', file)

    // Honeypot
    formData.append('bot_field', '')

    const result = await submitKaryaTulisAction(formData)

    if (result.success) {
      setSuccess(result.submissionNumber ?? 'Terkirim')
      reset()
      setFile(null)
      setImportWarnings([])
      setImportSessionId(null)
      setImportAssetManifest(null)
      setImportedImageUrls([])
    } else {
      setGlobalError(result.error || 'Terjadi kesalahan')
    }
  }

  const uploadInlineImage = async (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    const result = await uploadWritingInlineImageAction(formData)
    return { url: result.url, error: result.error }
  }

  if (success) {
    return (
      <Card className="mt-8 border-success/30 bg-success-surface shadow-none">
        <CardContent className="p-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/20 text-success mb-6">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h2 className="font-heading text-2xl font-bold text-foreground">Karya Tulis Berhasil Dikirim</h2>
          <p className="mt-2 text-muted max-w-md mx-auto">
            Terima kasih telah berkontribusi. Tulisan Anda akan direview oleh tim redaksi kami sebelum dipublikasikan.
          </p>
          <p className="mx-auto mt-4 w-fit rounded-md bg-surface px-3 py-2 font-mono text-sm font-bold text-primary">{success}</p>
          <Button className="mt-6" variant="primary" onClick={() => setSuccess(null)}>
            Kirim Tulisan Baru
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="mt-8 border-border bg-transparent shadow-none">
      <CardContent className="p-0 sm:p-0">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">

          {globalError && (
            <div className="flex items-center gap-3 rounded-lg bg-destructive/10 p-4 text-destructive">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <p className="text-sm font-medium">{globalError}</p>
            </div>
          )}

          <div className="space-y-4 border-t-2 border-accent pt-5">
            <h3 className="font-heading text-xl font-bold text-primary">Identitas Penulis</h3>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Nama Lengkap" htmlFor="authorName" error={errors.authorName?.message} required>
                <Input id="authorName" {...register('authorName')} disabled={isSubmitting} placeholder="Masukkan nama lengkap Anda" />
              </Field>
              <Field label="Email" htmlFor="authorEmail" error={errors.authorEmail?.message} required>
                <Input id="authorEmail" type="email" {...register('authorEmail')} disabled={isSubmitting} placeholder="contoh@email.com" />
              </Field>
              <Field label="No. WhatsApp" htmlFor="authorWhatsapp" error={errors.authorWhatsapp?.message} required>
                <Input id="authorWhatsapp" {...register('authorWhatsapp')} disabled={isSubmitting} placeholder="Contoh: 081234567890" />
              </Field>
              <Field label="Status IKMI" htmlFor="authorStatus" error={errors.authorStatus?.message} required>
                <Controller name="authorStatus" control={control} render={({ field }) => <ListboxSelect id="authorStatus" value={field.value} onValueChange={field.onChange} disabled={isSubmitting} options={[{ value: 'Anggota', label: 'Anggota' }, { value: 'Pengurus', label: 'Pengurus' }]} />} />
              </Field>
              {authorStatus === 'Pengurus' ? <Field label="Unit / Departemen" htmlFor="authorUnit" error={errors.authorUnit?.message} required><Input id="authorUnit" {...register('authorUnit')} disabled={isSubmitting} /></Field> : null}
            </div>
          </div>

          <div className="space-y-4 border-t border-border pt-6">
            <h3 className="font-heading text-xl font-bold text-primary">Informasi Tulisan</h3>

            <Field label="Judul Tulisan" htmlFor="title" error={errors.title?.message} required>
              <Input id="title" {...register('title')} disabled={isSubmitting} placeholder="Judul tulisan Anda" />
            </Field>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-sm font-medium">Kategori Tulisan <span className="text-destructive">*</span></label>
                <Controller
                  name="category"
                  control={control}
                  render={({ field }) => (
                    <ListboxSelect
                      options={[
                        { value: 'Opini', label: 'Opini' },
                        { value: 'Artikel', label: 'Artikel' },
                        { value: 'Kajian', label: 'Kajian' },
                      ]}
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={isSubmitting}
                    />
                  )}
                />
                {errors.category && <p className="text-xs text-destructive mt-1">{errors.category.message}</p>}
              </div>

              <Field label="Topik (Opsional)" htmlFor="topic" error={errors.topic?.message}>
                <Input id="topic" {...register('topic')} disabled={isSubmitting} placeholder="Misal: Teknologi, Keislaman, Sosial" />
              </Field>
            </div>

            <Field label="Ringkasan Pendek (Opsional)" htmlFor="summary" error={errors.summary?.message}>
              <Textarea
                id="summary"
                {...register('summary')}
                disabled={isSubmitting}
                rows={3}
                placeholder="Ringkasan singkat tentang isi tulisan Anda..."
              />
            </Field>

            <Field label="Isi Tulisan (untuk tulis langsung)" htmlFor="writing-content" error={errors.content?.message}>
              <Controller
                name="content"
                control={control}
                render={({ field }) => (
                  <ArticleEditor
                    id="writing-content"
                    value={field.value || ''}
                    onChange={field.onChange}
                    disabled={isSubmitting || isImporting}
                    onImageUpload={uploadInlineImage}
                  />
                )}
              />
              <p className="text-xs text-muted">Gunakan heading untuk bagian tulisan; judul artikel diisi pada kolom Judul Tulisan.</p>
            </Field>
          </div>

          <div className="space-y-4 border-t border-border pt-6">
            <h3 className="font-heading text-xl font-bold text-primary">Lampiran Dokumen (alternatif tulis langsung)</h3>
            <p className="text-sm text-muted mb-2">
              Kirim isi tulisan langsung atau naskah asli dalam format <strong>DOCX</strong> atau <strong>PDF</strong> (maksimal <strong>10MB</strong>). DOCX dapat diimpor secara opsional ke editor; semua dokumen tetap disimpan sebagai lampiran.
            </p>

            {!file ? (
              <div className="flex justify-center rounded-lg border-2 border-dashed border-border px-6 py-10 transition-colors hover:border-primary/50">
                <div className="text-center">
                  <UploadCloud className="mx-auto h-12 w-12 text-muted" aria-hidden="true" />
                  <div className="mt-4 flex text-sm leading-6 text-muted">
                    <label
                      htmlFor="file-upload"
                      className="relative cursor-pointer rounded-md font-semibold text-primary focus-within:outline-none focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 hover:text-primary/80"
                    >
                      <span>Pilih file</span>
                      <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" disabled={isSubmitting || isImporting} />
                    </label>
                    <p className="pl-1">atau drag and drop</p>
                  </div>
                  <p className="text-xs leading-5 text-muted">DOCX atau PDF (maks. 10MB)</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between rounded-lg border border-border p-4 bg-muted/30">
                <div className="flex items-center space-x-3 truncate">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="truncate">
                    <p className="truncate text-sm font-medium text-foreground">{file.name}</p>
                    <p className="text-xs text-muted">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {file.name.toLowerCase().endsWith('.docx') ? <Button type="button" variant="secondary" size="sm" onClick={() => void importDocx()} disabled={isSubmitting || isImporting}>{isImporting ? 'Mengimpor...' : 'Impor ke editor'}</Button> : null}
                  <Button type="button" variant="ghost" size="icon" aria-label="Hapus lampiran" onClick={() => void removeFile()} disabled={isSubmitting || isImporting} className="text-muted hover:text-destructive shrink-0">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
            {importWarnings.length > 0 ? <div className="rounded-lg border border-warning/30 bg-warning/10 p-4 text-sm text-foreground" role="status"><p className="font-semibold">Catatan impor</p><ul className="mt-2 list-disc space-y-1 pl-5">{importWarnings.map((warning, index) => <li key={warning + '-' + index}>{warning}</li>)}</ul></div> : null}
          </div>

          <div className="flex flex-col gap-4 border-t border-border pt-4 sm:flex-row sm:items-start sm:justify-between">
            <label className="mb-5 flex items-start gap-3 text-sm leading-6 text-text-secondary sm:mr-auto sm:max-w-xl">
              <input type="checkbox" value="on" {...register('consent')} className="mt-1 h-5 w-5 shrink-0 accent-primary" />
              <span>Saya berhak mengirim tulisan ini, menyetujui proses penyuntingan, pencantuman nama penulis, dan penggunaan data untuk proses editorial.</span>
            </label>
            {errors.consent ? <p className="text-sm font-medium text-danger" role="alert">{errors.consent.message}</p> : null}
            <Button type="submit" variant="primary" disabled={isSubmitting || isImporting} size="md" className="w-full sm:w-auto">
              {isSubmitting ? 'Mengirim Tulisan...' : 'Kirim Tulisan'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
