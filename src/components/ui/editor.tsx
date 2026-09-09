'use client'

import { useEffect, useRef, useState } from 'react'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import {
  Bold,
  Heading2,
  Heading3,
  ImagePlus,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Quote,
  Redo,
  Undo,
  Unlink,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export type ArticleImageUploadResult = {
  url?: string
  error?: string
}

export type ArticleEditorProps = {
  id?: string
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  onImageUpload?: (file: File) => Promise<ArticleImageUploadResult>
}

const FigureImage = Image.extend({
  name: 'figureImage',

  addAttributes() {
    return {
      ...this.parent?.(),
      caption: {
        default: null,
        parseHTML: (element) => element.querySelector('figcaption')?.textContent?.trim() || null,
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'figure',
        getAttrs: (node) => {
          if (!(node instanceof HTMLElement)) return false
          const image = node.querySelector('img')
          if (!image?.getAttribute('src')) return false

          return {
            src: image.getAttribute('src'),
            alt: image.getAttribute('alt') || null,
            title: image.getAttribute('title') || null,
            caption: node.querySelector('figcaption')?.textContent?.trim() || null,
          }
        },
      },
      {
        tag: 'img[src]',
        getAttrs: (node) => {
          if (!(node instanceof HTMLElement)) return false
          return {
            src: node.getAttribute('src'),
            alt: node.getAttribute('alt') || null,
            title: node.getAttribute('title') || null,
            caption: null,
          }
        },
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    const { caption, ...imageAttributes } = HTMLAttributes
    const children: unknown[] = [['img', imageAttributes]]
    if (typeof caption === 'string' && caption.trim()) {
      children.push(['figcaption', { class: 'article-figure-caption' }, caption.trim()])
    }

    return ['figure', { class: 'article-figure' }, ...children]
  },
})

/** The actual editor extension set, shared by the browser component and tests. */
export const articleEditorExtensions = [
  // Parse every historical heading level so an existing article can be opened
  // and saved without turning its semantic headings into paragraphs. The
  // toolbar below intentionally exposes only H2 and H3 to authors.
  StarterKit.configure({
    heading: { levels: [1, 2, 3, 4, 5, 6] },
    link: false,
    underline: false,
  }),
  Link.configure({
    openOnClick: false,
    autolink: true,
    linkOnPaste: true,
    HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' },
  }),
  FigureImage.configure({
    allowBase64: false,
  }),
]

/** Pasted article titles become a normal body heading; loaded legacy H1s do not. */
export function normalizePastedArticleHtml(html: string) {
  return html
    .replace(/<h1\b[^>]*>/gi, '<h2>')
    .replace(/<\/h1\s*>/gi, '</h2>')
}

function isHttpUrl(value: string) {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' || url.protocol === 'http:'
  } catch {
    return false
  }
}

/**
 * The sole rich-text input for publication CMS and public direct submissions.
 * Titles remain form-owned; the schema intentionally exposes only H2 and H3.
 */
export function ArticleEditor({ id, value, onChange, disabled = false, onImageUpload }: ArticleEditorProps) {
  const [imagePanelOpen, setImagePanelOpen] = useState(false)
  const [linkPanelOpen, setLinkPanelOpen] = useState(false)
  const [imageUrl, setImageUrl] = useState('')
  const [imageAlt, setImageAlt] = useState('')
  const [imageCaption, setImageCaption] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imageError, setImageError] = useState('')
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const [linkError, setLinkError] = useState('')
  const latestValue = useRef(value)

  const editor = useEditor({
    immediatelyRender: false,
    extensions: articleEditorExtensions,
    content: value,
    editable: !disabled,
    onUpdate: ({ editor: currentEditor }) => {
      const nextValue = currentEditor.getHTML()
      latestValue.current = nextValue
      onChange(nextValue)
    },
    editorProps: {
      transformPastedHTML: normalizePastedArticleHtml,
      attributes: {
        ...(id ? { id } : {}),
        class: 'article-editor-content prose prose-sm sm:prose-base max-w-none min-h-[300px] px-4 py-3 text-primary focus:outline-none prose-headings:font-heading prose-headings:text-primary prose-p:text-primary prose-li:text-primary prose-blockquote:border-l-accent prose-blockquote:text-primary',
      },
    },
  })

  useEffect(() => {
    if (!editor || value === latestValue.current) return
    editor.commands.setContent(value, { emitUpdate: false })
    latestValue.current = value
  }, [editor, value])

  useEffect(() => {
    editor?.setEditable(!disabled)
  }, [disabled, editor])

  if (!editor) return null

  const closeImagePanel = () => {
    setImagePanelOpen(false)
    setImageUrl('')
    setImageAlt('')
    setImageCaption('')
    setImageFile(null)
    setImageError('')
  }

  const insertImage = async () => {
    setImageError('')
    const alt = imageAlt.trim()
    if (!alt) {
      setImageError('Teks alternatif gambar wajib diisi.')
      return
    }

    let src = imageUrl.trim()
    if (imageFile) {
      if (!onImageUpload) {
        setImageError('Unggah gambar belum tersedia pada formulir ini.')
        return
      }
      setIsUploadingImage(true)
      const result = await onImageUpload(imageFile)
      setIsUploadingImage(false)
      if (!result.url) {
        setImageError(result.error || 'Gambar belum dapat diunggah.')
        return
      }
      src = result.url
    }

    if (!isHttpUrl(src)) {
      setImageError('Masukkan URL gambar HTTP(S) yang valid atau pilih file gambar.')
      return
    }

    editor.chain().focus().insertContent({
      type: 'figureImage',
      attrs: { src, alt, caption: imageCaption.trim() || null },
    }).run()
    closeImagePanel()
  }

  const applyLink = () => {
    setLinkError('')
    const url = linkUrl.trim()
    if (!isHttpUrl(url)) {
      setLinkError('Tautan harus berupa URL HTTP(S) yang valid.')
      return
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
    setLinkPanelOpen(false)
    setLinkUrl('')
  }

  const controls = [
    { label: 'Tebal', icon: Bold, active: editor.isActive('bold'), onClick: () => editor.chain().focus().toggleBold().run() },
    { label: 'Miring', icon: Italic, active: editor.isActive('italic'), onClick: () => editor.chain().focus().toggleItalic().run() },
    { label: 'Heading 2', icon: Heading2, active: editor.isActive('heading', { level: 2 }), onClick: () => editor.chain().focus().toggleHeading({ level: 2 }).run() },
    { label: 'Heading 3', icon: Heading3, active: editor.isActive('heading', { level: 3 }), onClick: () => editor.chain().focus().toggleHeading({ level: 3 }).run() },
    { label: 'Daftar tanpa nomor', icon: List, active: editor.isActive('bulletList'), onClick: () => editor.chain().focus().toggleBulletList().run() },
    { label: 'Daftar bernomor', icon: ListOrdered, active: editor.isActive('orderedList'), onClick: () => editor.chain().focus().toggleOrderedList().run() },
    { label: 'Kutipan', icon: Quote, active: editor.isActive('blockquote'), onClick: () => editor.chain().focus().toggleBlockquote().run() },
  ]

  return (
    <div className="overflow-hidden rounded-xl bg-surface ring-1 ring-line">
      <div className="flex flex-wrap items-center gap-1 border-b border-line bg-background p-2">
        {controls.map((control) => (
          <ToolbarButton key={control.label} {...control} disabled={disabled} />
        ))}
        <ToolbarButton label="Tambah tautan" icon={LinkIcon} active={editor.isActive('link')} disabled={disabled} onClick={() => { setLinkUrl(editor.getAttributes('link').href || ''); setLinkPanelOpen(true) }} />
        <ToolbarButton label="Hapus tautan" icon={Unlink} disabled={disabled || !editor.isActive('link')} onClick={() => editor.chain().focus().unsetLink().run()} />
        <ToolbarButton label="Tambah gambar" icon={ImagePlus} disabled={disabled} onClick={() => setImagePanelOpen(true)} />
        <span className="mx-1 h-6 w-px bg-line" aria-hidden="true" />
        <ToolbarButton label="Urungkan" icon={Undo} disabled={disabled || !editor.can().chain().focus().undo().run()} onClick={() => editor.chain().focus().undo().run()} />
        <ToolbarButton label="Ulangi" icon={Redo} disabled={disabled || !editor.can().chain().focus().redo().run()} onClick={() => editor.chain().focus().redo().run()} />
      </div>

      {linkPanelOpen ? (
        <div className="grid gap-3 border-b border-line bg-background/70 p-3 sm:grid-cols-[1fr_auto_auto]" role="group" aria-label="Tambah tautan">
          <Input aria-label="URL tautan" value={linkUrl} onChange={(event) => setLinkUrl(event.target.value)} placeholder="https://contoh.id/sumber" disabled={disabled} />
          <Button type="button" size="sm" onClick={applyLink} disabled={disabled}>Simpan tautan</Button>
          <Button type="button" size="sm" variant="secondary" onClick={() => { setLinkPanelOpen(false); setLinkError('') }}>Batal</Button>
          {linkError ? <p className="text-sm text-danger sm:col-span-3" role="alert">{linkError}</p> : null}
        </div>
      ) : null}

      {imagePanelOpen ? (
        <div className="grid gap-3 border-b border-line bg-background/70 p-3" role="group" aria-label="Tambah gambar artikel">
          <Input aria-label="File gambar artikel" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setImageFile(event.target.files?.[0] || null)} disabled={disabled || isUploadingImage} />
          <p className="text-xs text-muted">Atau gunakan URL gambar publik. JPG, PNG, dan WebP maksimal 2 MB untuk unggahan.</p>
          <Input aria-label="URL gambar artikel" value={imageUrl} onChange={(event) => setImageUrl(event.target.value)} placeholder="https://..." disabled={disabled || isUploadingImage || Boolean(imageFile)} />
          <Input aria-label="Teks alternatif gambar" value={imageAlt} onChange={(event) => setImageAlt(event.target.value)} placeholder="Deskripsikan isi gambar" disabled={disabled || isUploadingImage} />
          <Input aria-label="Caption gambar" value={imageCaption} onChange={(event) => setImageCaption(event.target.value)} placeholder="Caption gambar (opsional)" disabled={disabled || isUploadingImage} />
          {imageError ? <p className="text-sm text-danger" role="alert">{imageError}</p> : null}
          <div className="flex flex-wrap justify-end gap-2">
            <Button type="button" size="sm" variant="secondary" onClick={closeImagePanel} disabled={isUploadingImage}>Batal</Button>
            <Button type="button" size="sm" onClick={() => void insertImage()} disabled={disabled || isUploadingImage}>{isUploadingImage ? 'Mengunggah...' : 'Sisipkan gambar'}</Button>
          </div>
        </div>
      ) : null}

      <EditorContent editor={editor} />
    </div>
  )
}

function ToolbarButton({ label, icon: Icon, active = false, disabled, onClick }: {
  label: string
  icon: typeof Bold
  active?: boolean
  disabled?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={cn('rounded-xl p-2 text-primary transition hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-50', active && 'ikmi-liquid-blue')}
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
    </button>
  )
}

/** @deprecated Use ArticleEditor. Kept as a compatibility alias for existing consumers. */
export const Editor = ArticleEditor
