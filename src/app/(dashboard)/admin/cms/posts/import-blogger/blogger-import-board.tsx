'use client'

import { useMemo, useState, useTransition } from 'react'
import { CheckCircle2, ExternalLink, ImageUp, Import, LoaderCircle } from 'lucide-react'
import { Alert } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Select } from '@/components/ui/select'
import { getBloggerImportPreviewAction, importBloggerPostsAction, migrateBloggerImagesAction } from '@/features/blog/actions'
import type { BloggerImportPreview } from '@/features/blog/blogger-import'

type Category = { id: string; name: string; slug: string }
type Selection = Record<string, { checked: boolean; categoryId: string }>
const ARTICLE_TITLE_KEYWORDS = ['tradisi ngarot', 'nadra', 'unjungan']
const OPINION_TITLE_KEYWORDS = ['manifesto mahasiswa kiri', 'cinta adalah akar dari segala disensus']

function formatDate(value: string) {
  return new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' }).format(new Date(value))
}

export function BloggerImportBoard({ categories }: { categories: Category[] }) {
  const [posts, setPosts] = useState<BloggerImportPreview[]>([])
  const [selection, setSelection] = useState<Selection>({})
  const [message, setMessage] = useState<{ tone: 'success' | 'danger' | 'warning'; title: string; detail: string } | null>(null)
  const [isPending, startTransition] = useTransition()

  const categoryDefaults = useMemo(
    () => ({
      articleId: categories.find((category) => category.slug === 'artikel')?.id ?? '',
      newsId: categories.find((category) => category.slug === 'berita')?.id ?? '',
      opinionId: categories.find((category) => category.slug === 'opini')?.id ?? '',
    }),
    [categories],
  )
  const selectedPosts = useMemo(
    () => posts.filter((post) => selection[post.sourcePostId]?.checked && !post.duplicate),
    [posts, selection],
  )
  const hasIncompleteCategory = selectedPosts.some((post) => !selection[post.sourcePostId]?.categoryId)

  function loadPreview() {
    setMessage(null)
    startTransition(async () => {
      const result = await getBloggerImportPreviewAction()
      if (!result.success) {
        setMessage({ tone: 'danger', title: 'Preview belum tersedia', detail: result.error })
        return
      }

      const initialSelection = Object.fromEntries(
        result.posts.map((post) => {
          const normalizedTitle = post.title.toLocaleLowerCase('id-ID')
          const categoryId = OPINION_TITLE_KEYWORDS.some((keyword) => normalizedTitle.includes(keyword))
            ? categoryDefaults.opinionId
            : ARTICLE_TITLE_KEYWORDS.some((keyword) => normalizedTitle.includes(keyword))
              ? categoryDefaults.articleId
              : categoryDefaults.newsId

          return [post.sourcePostId, { checked: false, categoryId }]
        }),
      )
      setPosts(result.posts)
      setSelection(initialSelection)
      setMessage({
        tone: 'success',
        title: 'Preview siap ditinjau',
        detail: `${result.posts.length} postingan ditemukan. Dua judul Opini, Tradisi Ngarot/Nadra/Unjungan sebagai Artikel, dan sisanya sebagai Berita. Semua kategori dapat diubah sebelum impor.`,
      })
    })
  }

  function togglePost(sourcePostId: string, checked: boolean) {
    setSelection((current) => ({
      ...current,
      [sourcePostId]: { ...current[sourcePostId], checked },
    }))
  }

  function setCategory(sourcePostId: string, categoryId: string) {
    setSelection((current) => ({
      ...current,
      [sourcePostId]: { ...current[sourcePostId], categoryId },
    }))
  }

  function importSelected() {
    if (!selectedPosts.length || hasIncompleteCategory) return
    setMessage(null)
    startTransition(async () => {
      const result = await importBloggerPostsAction({
        posts: selectedPosts.map((post) => ({
          sourcePostId: post.sourcePostId,
          categoryId: selection[post.sourcePostId].categoryId,
        })),
      })
      if (!result.success) {
        setMessage({ tone: 'danger', title: 'Import belum selesai', detail: result.error })
        return
      }

      setPosts((current) => current.map((post) => (
        selectedPosts.some((selected) => selected.sourcePostId === post.sourcePostId)
          ? { ...post, duplicate: true }
          : post
      )))
      setSelection({})
      setMessage({
        tone: 'success',
        title: 'Import selesai',
        detail: `${result.imported} postingan berhasil disimpan. ${result.skipped ? `${result.skipped} postingan dilewati karena sudah ada.` : ''}`.trim(),
      })
    })
  }

  function migrateImages() {
    setMessage(null)
    startTransition(async () => {
      const result = await migrateBloggerImagesAction()
      if (!result.success) {
        setMessage({ tone: 'danger', title: 'Gambar belum dipindahkan', detail: result.error })
        return
      }
      setMessage({
        tone: result.failed ? 'warning' : 'success',
        title: 'Migrasi gambar Blogger selesai',
        detail: `${result.copied} gambar dipindahkan ke Cloudinary dari ${result.postsUpdated}/${result.postsScanned} artikel.${result.failed ? ` ${result.failed} gambar tidak dapat dipindahkan.` : ''}`,
      })
    })
  }

  return (
    <div className="space-y-5">
      <Alert tone="warning" title="Gunakan hanya untuk arsip Blogger lama.">
        API key tetap berada di server. Konten disanitasi sebelum disimpan, tanggal terbit asli dipertahankan, dan sumber Blogger dicatat untuk mencegah duplikasi.
      </Alert>

      <Card className="glass-subtle shadow-none">
        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-heading text-lg font-bold text-primary">1. Muat preview postingan</h2>
            <p className="mt-1 text-sm leading-6 text-muted">Tidak ada data yang disimpan pada tahap ini.</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button variant="secondary" onClick={migrateImages} disabled={isPending} className="w-full sm:w-auto">
              {isPending ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <ImageUp className="h-4 w-4" aria-hidden="true" />}
              Sinkronkan gambar
            </Button>
            <Button onClick={loadPreview} disabled={isPending} className="w-full sm:w-auto">
              {isPending ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Import className="h-4 w-4" aria-hidden="true" />}
              Muat preview
            </Button>
          </div>
        </CardContent>
      </Card>

      {message && <Alert tone={message.tone} title={message.title}>{message.detail}</Alert>}

      {posts.length > 0 && (
        <Card className="glass-subtle shadow-none">
          <CardContent className="space-y-5 p-5">
            <div className="flex flex-col gap-3 border-b border-line pb-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="font-heading text-lg font-bold text-primary">2. Tinjau kategori postingan</h2>
                <p className="mt-1 text-sm text-muted">Blogger tidak memakai kategori. Dua judul Opini dipetakan ke Opini, Tradisi Ngarot/Nadra/Unjungan ke Artikel, dan post lain ke Berita. Semua kategori tetap dapat Anda sesuaikan.</p>
              </div>
              <p className="text-sm font-semibold text-primary">{selectedPosts.length} dipilih</p>
            </div>

            <div className="hidden overflow-hidden rounded-md border border-line md:block">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-line bg-surface-alt text-xs uppercase tracking-wider text-muted">
                  <tr>
                    <th className="w-14 px-4 py-3"><span className="sr-only">Pilih</span></th>
                    <th className="px-4 py-3">Postingan Blogger</th>
                    <th className="px-4 py-3">Tanggal</th>
                    <th className="px-4 py-3">Kategori IKMI</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {posts.map((post) => <PostRow key={post.sourcePostId} post={post} categories={categories} selected={selection[post.sourcePostId]} onToggle={togglePost} onCategoryChange={setCategory} />)}
                </tbody>
              </table>
            </div>

            <div className="grid gap-3 md:hidden">
              {posts.map((post) => <PostCard key={post.sourcePostId} post={post} categories={categories} selected={selection[post.sourcePostId]} onToggle={togglePost} onCategoryChange={setCategory} />)}
            </div>

            <div className="flex flex-col gap-3 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted">Post akan langsung tampil sebagai publikasi dengan tanggal terbit lamanya.</p>
              <Button onClick={importSelected} disabled={isPending || !selectedPosts.length || hasIncompleteCategory} className="w-full sm:w-auto">
                {isPending ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <CheckCircle2 className="h-4 w-4" aria-hidden="true" />}
                Import {selectedPosts.length || ''} postingan
              </Button>
            </div>
            {hasIncompleteCategory && <p className="text-sm font-medium text-warning">Pilih kategori IKMI untuk setiap postingan yang dipilih.</p>}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

type PostControlProps = {
  post: BloggerImportPreview
  categories: Category[]
  selected: { checked: boolean; categoryId: string } | undefined
  onToggle: (sourcePostId: string, checked: boolean) => void
  onCategoryChange: (sourcePostId: string, categoryId: string) => void
}

function PostRow({ post, categories, selected, onToggle, onCategoryChange }: PostControlProps) {
  return (
    <tr className={post.duplicate ? 'bg-surface-alt/60' : undefined}>
      <td className="px-4 py-4 align-top">
        <Checkbox checked={Boolean(selected?.checked)} disabled={post.duplicate} onCheckedChange={(checked) => onToggle(post.sourcePostId, checked)} aria-label={`Pilih ${post.title}`} />
      </td>
      <td className="px-4 py-4 align-top">
        <a href={post.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-start gap-2 font-semibold text-primary hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
          <span>{post.title}</span><ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        </a>
        <p className="mt-1 text-xs text-muted">{post.authorName || 'Penulis Blogger tidak tercatat'}{post.labels.length ? ` · ${post.labels.join(', ')}` : ''}</p>
      </td>
      <td className="px-4 py-4 align-top text-muted">{formatDate(post.publishedAt)}</td>
      <td className="px-4 py-4 align-top">
        <CategorySelect categories={categories} value={selected?.categoryId || ''} disabled={post.duplicate || !selected?.checked} onValueChange={(value) => onCategoryChange(post.sourcePostId, value)} />
      </td>
      <td className="px-4 py-4 align-top">{post.duplicate ? <Badge tone="surface">Sudah diimpor</Badge> : <Badge tone="accent">Siap ditinjau</Badge>}</td>
    </tr>
  )
}

function PostCard({ post, categories, selected, onToggle, onCategoryChange }: PostControlProps) {
  return (
    <article className="border-l-2 border-line px-4 py-4">
      <div className="flex items-start gap-3">
        <Checkbox checked={Boolean(selected?.checked)} disabled={post.duplicate} onCheckedChange={(checked) => onToggle(post.sourcePostId, checked)} aria-label={`Pilih ${post.title}`} />
        <div className="min-w-0 flex-1">
          <a href={post.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-start gap-2 font-heading font-bold text-primary hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
            <span>{post.title}</span><ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          </a>
          <p className="mt-2 text-xs text-muted">{formatDate(post.publishedAt)} · {post.authorName || 'Penulis Blogger tidak tercatat'}</p>
          {post.labels.length > 0 && <p className="mt-1 text-xs text-muted">{post.labels.join(', ')}</p>}
          <div className="mt-3 flex items-center gap-2">{post.duplicate ? <Badge tone="surface">Sudah diimpor</Badge> : <Badge tone="accent">Siap ditinjau</Badge>}</div>
          <div className="mt-4">
            <label className="text-sm font-semibold text-primary" htmlFor={`category-${post.sourcePostId}`}>Kategori IKMI</label>
            <CategorySelect id={`category-${post.sourcePostId}`} categories={categories} value={selected?.categoryId || ''} disabled={post.duplicate || !selected?.checked} onValueChange={(value) => onCategoryChange(post.sourcePostId, value)} />
          </div>
        </div>
      </div>
    </article>
  )
}

function CategorySelect({ categories, value, disabled, onValueChange, id }: { categories: Category[]; value: string; disabled: boolean; onValueChange: (value: string) => void; id?: string }) {
  return (
    <Select id={id} value={value} disabled={disabled} onValueChange={onValueChange} className="mt-1 min-w-44 text-sm">
      <option value="">Pilih kategori</option>
      {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
    </Select>
  )
}
