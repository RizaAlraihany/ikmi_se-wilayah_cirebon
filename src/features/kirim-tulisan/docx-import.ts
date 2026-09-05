import 'server-only'

import { createHmac, timingSafeEqual } from 'node:crypto'
import { randomUUID } from 'node:crypto'
import JSZip from 'jszip'
import mammoth from 'mammoth'
import * as parse5 from 'parse5'
import type { DefaultTreeAdapterTypes } from 'parse5'
import { env } from '@/core/config/env'
import { sanitizeArticleHtml } from '@/features/blog/article-html'
import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE, validateDocumentSignature, validateImageSignature } from '@/core/storage/file-validator'
import { getDocxImportPublicIdFromUrl, getDocxImportSessionIdFromUrl, isDocxImportSessionId, isDocxImportTemporaryUrl, isOwnedDocxImportPublicId, storageService } from '@/core/storage/storage-service'

export const MAX_DOCX_ENTRIES = 500
export const MAX_DOCX_UNCOMPRESSED_BYTES = 25 * 1024 * 1024
export const MAX_IMPORTED_HTML_LENGTH = 1_000_000
export const MAX_IMPORTED_IMAGES = 20
export const DOCX_IMPORT_STALE_AFTER_MS = 24 * 60 * 60 * 1000

const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
const ACTIVE_CONTENT_PATHS = [
  /^word\/vbaProject\.bin$/i,
  /^word\/embeddings\//i,
  /^word\/activeX\//i,
]

export type DocxImportResult = {
  title?: string
  excerpt?: string
  html: string
  warnings: string[]
  importSessionId: string
  importAssetManifest: string
  importedImages: Array<{ publicId: string; url: string }>
}

export type DocxImportAsset = { publicId: string; url: string }
export type VerifiedDocxImportManifest = { sessionId: string; assets: DocxImportAsset[]; issuedAt: number }

const DOCX_IMPORT_MANIFEST_VERSION = 1
const DOCX_IMPORT_MANIFEST_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000

function encodeManifestPayload(manifest: { sessionId: string; assets: DocxImportAsset[]; issuedAt: number }) {
  return Buffer.from(JSON.stringify({ v: DOCX_IMPORT_MANIFEST_VERSION, ...manifest })).toString('base64url')
}

function signManifestPayload(payload: string) {
  return createHmac('sha256', env.AUTH_SECRET).update(payload).digest('base64url')
}

function normalizeUrl(value: string) {
  try {
    return new URL(value.trim()).href
  } catch {
    return value.trim()
  }
}

export function createDocxImportAssetManifest(sessionId: string, assets: DocxImportAsset[]) {
  const payload = encodeManifestPayload({ sessionId, assets, issuedAt: Date.now() })
  return `${payload}.${signManifestPayload(payload)}`
}

export function verifyDocxImportAssetManifest(value: unknown): VerifiedDocxImportManifest | null {
  if (typeof value !== 'string' || value.length > 32_000) return null
  const parts = value.split('.')
  if (parts.length !== 2) return null
  const [payload, signature] = parts
  if (!payload || !signature) return null
  const expected = signManifestPayload(payload)
  const receivedBytes = Buffer.from(signature, 'base64url')
  const expectedBytes = Buffer.from(expected, 'base64url')
  if (receivedBytes.length !== expectedBytes.length || !timingSafeEqual(receivedBytes, expectedBytes)) return null

  try {
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as {
      v?: number
      sessionId?: unknown
      assets?: unknown
      issuedAt?: unknown
    }
    if (decoded.v !== DOCX_IMPORT_MANIFEST_VERSION || typeof decoded.sessionId !== 'string' || !isDocxImportSessionId(decoded.sessionId)) return null
    if (typeof decoded.issuedAt !== 'number' || Date.now() - decoded.issuedAt > DOCX_IMPORT_MANIFEST_MAX_AGE_MS || decoded.issuedAt > Date.now() + 60_000) return null
    if (!Array.isArray(decoded.assets) || decoded.assets.length > MAX_IMPORTED_IMAGES) return null
    const assets = decoded.assets.filter((asset): asset is DocxImportAsset => {
      if (!asset || typeof asset !== 'object') return false
      const candidate = asset as Record<string, unknown>
      return typeof candidate.publicId === 'string'
        && typeof candidate.url === 'string'
        && isOwnedDocxImportPublicId(candidate.publicId, decoded.sessionId as string)
        && isDocxImportTemporaryUrl(candidate.url)
        && getDocxImportSessionIdFromUrl(candidate.url as string) === decoded.sessionId
        && getDocxImportPublicIdFromUrl(candidate.url as string, decoded.sessionId as string) === candidate.publicId
    })
    if (assets.length !== decoded.assets.length || new Set(assets.map((asset) => asset.url)).size !== assets.length) return null
    return { sessionId: decoded.sessionId, assets, issuedAt: decoded.issuedAt }
  } catch {
    return null
  }
}

export class DocxImportError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'DocxImportError'
  }
}

type HtmlElement = DefaultTreeAdapterTypes.Element
type HtmlNode = DefaultTreeAdapterTypes.ChildNode
type HtmlParent = DefaultTreeAdapterTypes.ParentNode
type HtmlTextNode = DefaultTreeAdapterTypes.TextNode

export async function cleanupStaleDocxImportAssets(protectedPublicIds: string[] = []) {
  try {
    await storageService.cleanupStaleDocxImportAssets(new Date(Date.now() - DOCX_IMPORT_STALE_AFTER_MS), protectedPublicIds)
  } catch (error) {
    // Stale cleanup is opportunistic; an unavailable cleanup API must not
    // prevent a user from importing a document. The next import retries it.
    console.error('Stale DOCX import image cleanup failed:', error)
  }
}

function persistedImageSources(html: string) {
  const sources: string[] = []
  const imagePattern = /<img\b[^>]*\bsrc\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi
  for (const match of html.matchAll(imagePattern)) {
    sources.push(match[1] || match[2] || match[3] || '')
  }
  return sources
}

export function isDocxImportAssetPersistedAndOwned(content: string, asset: DocxImportAsset, sessionId: string) {
  if (!isDocxImportSessionId(sessionId)
    || !isOwnedDocxImportPublicId(asset.publicId, sessionId)
    || getDocxImportPublicIdFromUrl(asset.url, sessionId) !== asset.publicId) return false

  const normalizedAssetUrl = normalizeUrl(asset.url)
  return persistedImageSources(content).some((url) => {
    return normalizeUrl(url) === normalizedAssetUrl
      && getDocxImportSessionIdFromUrl(url) === sessionId
      && getDocxImportPublicIdFromUrl(url, sessionId) === asset.publicId
  })
}

export function getPersistedDocxImportPublicIds(html: string) {
  const ids = new Set<string>()
  for (const url of persistedImageSources(html)) {
    const sessionId = getDocxImportSessionIdFromUrl(url)
    const publicId = sessionId ? getDocxImportPublicIdFromUrl(url, sessionId) : null
    if (publicId) ids.add(publicId)
  }
  return [...ids]
}

export async function discardDocxImportAssets(sessionId: string, keepPublicIds: string[] = []) {
  if (!isDocxImportSessionId(sessionId)) return
  await storageService.deleteDocxImportAssets(sessionId, keepPublicIds)
}

function importedPublicIdsInHtml(html: string, manifest: VerifiedDocxImportManifest) {
  const ids = new Set<string>()
  const imagePattern = /<img\b[^>]*\bsrc\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi
  for (const match of html.matchAll(imagePattern)) {
    const url = match[1] || match[2] || match[3] || ''
    const issuedAsset = manifest.assets.find((asset) => normalizeUrl(asset.url) === normalizeUrl(url))
    if (issuedAsset) ids.add(issuedAsset.publicId)
  }
  return [...ids]
}

export function sanitizeDocxImportHtml(value: string, manifestToken?: string) {
  const manifest = verifyDocxImportAssetManifest(manifestToken)
  const allowedUrls = new Set((manifest?.assets || []).map((asset) => normalizeUrl(asset.url)))
  const root = parse5.parseFragment(sanitizeArticleHtml(value, { normalizeHeadingOne: true }))
  const images: HtmlElement[] = []
  const visit = (node: HtmlNode) => {
    if (isElement(node)) {
      if (node.tagName === 'img') images.push(node)
      for (const child of node.childNodes) visit(child)
    }
  }
  for (const child of root.childNodes) visit(child)
  for (const image of images) {
    const src = getAttribute(image, 'src')
    if (!isDocxImportTemporaryUrl(src) || allowedUrls.has(normalizeUrl(src))) continue
    const figure = image.parentNode && isElement(image.parentNode) && image.parentNode.tagName === 'figure' ? image.parentNode : image
    removeNode(figure.parentNode || root, figure)
  }
  return parse5.serialize(root)
}

export async function finalizeDocxImportAssets(manifestToken: string, html: string) {
  const manifest = verifyDocxImportAssetManifest(manifestToken)
  if (!manifest) throw new DocxImportError('Sesi impor DOCX tidak valid atau sudah kedaluwarsa.')
  let lastError: unknown
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      await storageService.deleteDocxImportAssets(manifest.sessionId, importedPublicIdsInHtml(html, manifest))
      return
    } catch (error) {
      lastError = error
    }
  }
  throw lastError instanceof Error ? lastError : new Error('Finalisasi gambar DOCX gagal.')
}

function isElement(node: HtmlNode | HtmlParent): node is HtmlElement {
  return parse5.defaultTreeAdapter.isElementNode(node as HtmlNode)
}

function isTextNode(node: HtmlNode): node is HtmlTextNode {
  return parse5.defaultTreeAdapter.isTextNode(node)
}

function getAttribute(element: HtmlElement, name: string) {
  return element.attrs.find((attribute) => attribute.name === name)?.value || ''
}

function setParent(node: HtmlNode, parent: HtmlParent) {
  if ('parentNode' in node) node.parentNode = parent
}

function textContent(node: HtmlNode): string {
  if (isTextNode(node)) return node.value
  if (!('childNodes' in node)) return ''
  return node.childNodes.map(textContent).join('')
}

function normalizedText(value: string) {
  return value.replace(/\s+/g, ' ').trim()
}

function isMeaningfulElement(element: HtmlElement) {
  return normalizedText(textContent(element)).length > 0
}

function removeNode(parent: HtmlParent, node: HtmlNode) {
  const index = parent.childNodes.indexOf(node)
  if (index >= 0) parent.childNodes.splice(index, 1)
}

function hasClass(element: HtmlElement, className: string) {
  return getAttribute(element, 'class').split(/\s+/).includes(className)
}

function isImageOnlyParagraph(element: HtmlElement) {
  if (element.tagName !== 'p') return false
  const children = element.childNodes.filter((node) => !isTextNode(node) || node.value.trim())
  return children.length === 1 && isElement(children[0]) && children[0].tagName === 'img'
}

function createCaptionedFigure(paragraph: HtmlElement, caption: HtmlElement) {
  const image = paragraph.childNodes.find((node) => isElement(node) && node.tagName === 'img') as HtmlElement | undefined
  if (!image) return null

  const figureRoot = parse5.parseFragment('<figure class="article-figure"><figcaption></figcaption></figure>')
  const figure = figureRoot.childNodes.find(isElement)
  if (!figure) return null
  const figcaption = figure.childNodes.find((node): node is HtmlElement => isElement(node) && node.tagName === 'figcaption')
  if (!figcaption) return null
  figcaption.childNodes = caption.childNodes
  for (const child of figcaption.childNodes) setParent(child, figcaption)
  figure.childNodes = [image, figcaption]
  setParent(image, figure)
  setParent(figcaption, figure)
  return figure
}

function normalizeCaptionedImages(root: parse5.DefaultTreeAdapterTypes.DocumentFragment) {
  for (let index = 0; index < root.childNodes.length - 1; index += 1) {
    const imageParagraph = root.childNodes[index]
    const captionParagraph = root.childNodes[index + 1]
    if (!isElement(imageParagraph) || !isElement(captionParagraph)) continue
    if (!isImageOnlyParagraph(imageParagraph) || !hasClass(captionParagraph, 'docx-caption')) continue
    const figure = createCaptionedFigure(imageParagraph, captionParagraph)
    if (!figure) continue
    root.childNodes.splice(index, 2, figure)
    setParent(figure, root)
  }
}

function removeEmptyImageParagraphs(root: parse5.DefaultTreeAdapterTypes.DocumentFragment) {
  for (const node of [...root.childNodes]) {
    if (!isElement(node) || node.tagName !== 'p' || isMeaningfulElement(node)) continue
    const hasOnlyEmptyImages = node.childNodes.length > 0 && node.childNodes.every((child) => {
      if (isTextNode(child)) return !child.value.trim()
      return isElement(child) && child.tagName === 'img' && !getAttribute(child, 'src').trim()
    })
    if (hasOnlyEmptyImages) removeNode(root, node)
  }
}

function removeDocxClasses(root: parse5.DefaultTreeAdapterTypes.DocumentFragment) {
  const elements: HtmlElement[] = []
  const visit = (node: HtmlNode) => {
    if (isElement(node)) {
      elements.push(node)
      for (const child of node.childNodes) visit(child)
    }
  }
  for (const child of root.childNodes) visit(child)
  for (const element of elements) {
    const classAttribute = element.attrs.find((attribute) => attribute.name === 'class')
    if (classAttribute?.value.split(/\s+/).some((value) => value.startsWith('docx-'))) {
      element.attrs = element.attrs.filter((attribute) => attribute !== classAttribute)
    }
  }
}

function normalizeBody(root: parse5.DefaultTreeAdapterTypes.DocumentFragment) {
  const topLevelElements = root.childNodes.filter(isElement)
  const titleStyleNode = topLevelElements.find((element) => element.tagName === 'h1' && hasClass(element, 'docx-title') && isMeaningfulElement(element))
  const firstHeadingOne = topLevelElements.find((element) => element.tagName === 'h1' && isMeaningfulElement(element))
  const titleNode = titleStyleNode || firstHeadingOne || topLevelElements.find((element) => element.tagName === 'p' && isMeaningfulElement(element))
  const title = titleNode ? normalizedText(textContent(titleNode)) : undefined
  if (titleNode) removeNode(root, titleNode)

  const remainingElements = root.childNodes.filter(isElement)
  for (const element of remainingElements) {
    if (element.tagName === 'h1') {
      element.tagName = 'h2'
    } else if (/^h[2-6]$/.test(element.tagName)) {
      element.tagName = 'h3'
    }
  }

  normalizeCaptionedImages(root)
  removeEmptyImageParagraphs(root)

  // Captions are presentation metadata, not article prose. Select the
  // excerpt before docx-* classes are removed so orphan Caption-style
  // paragraphs remain identifiable and can never become the excerpt.
  const bodyParagraph = root.childNodes
    .filter(isElement)
    .find((element) => element.tagName === 'p' && !hasClass(element, 'docx-caption') && isMeaningfulElement(element))
  const excerptText = bodyParagraph ? normalizedText(textContent(bodyParagraph)) : ''
  const excerpt = excerptText
    ? (excerptText.length <= 220 ? excerptText : excerptText.slice(0, 220).trimEnd() + '...')
    : undefined

  removeDocxClasses(root)
  const html = sanitizeArticleHtml(parse5.serialize(root), { normalizeHeadingOne: true })
  if (html.length > MAX_IMPORTED_HTML_LENGTH) {
    throw new DocxImportError('Dokumen DOCX menghasilkan konten terlalu besar untuk diimpor.')
  }

  return { title, excerpt, html }
}

async function rollbackImportedImages(sessionId: string, publicIds: string[]) {
  if (!publicIds.length) return
  try {
    await storageService.deleteDocxImportAssets(sessionId)
  } catch (cleanupError) {
    console.error('DOCX import image cleanup failed:', cleanupError)
    await Promise.all(publicIds.map((publicId) => storageService.deleteFile(publicId, 'image', 'upload').catch((fallbackError) => {
      console.error('DOCX import image fallback cleanup failed:', fallbackError)
    })))
  }
}

async function validateDocxPackage(buffer: Buffer) {
  let zip: JSZip
  try {
    zip = await JSZip.loadAsync(buffer, { checkCRC32: true })
  } catch {
    throw new DocxImportError('Dokumen DOCX rusak atau bukan paket DOCX yang valid.')
  }

  const entries = Object.values(zip.files)
  const fileEntries = entries.filter((entry) => !entry.dir)
  if (fileEntries.length > MAX_DOCX_ENTRIES) {
    throw new DocxImportError('Dokumen DOCX memiliki terlalu banyak bagian untuk diproses.')
  }

  let estimatedSize = 0
  for (const entry of fileEntries) {
    if (entry.unsafeOriginalName && entry.unsafeOriginalName !== entry.name) {
      throw new DocxImportError('Struktur path dokumen DOCX tidak aman.')
    }
    if (ACTIVE_CONTENT_PATHS.some((pattern) => pattern.test(entry.name))) {
      throw new DocxImportError('Dokumen DOCX mengandung konten aktif yang tidak didukung.')
    }
    const metadata = (entry as unknown as { _data?: { uncompressedSize?: number } })._data
    if (typeof metadata?.uncompressedSize === 'number') estimatedSize += metadata.uncompressedSize
    if (estimatedSize > MAX_DOCX_UNCOMPRESSED_BYTES) {
      throw new DocxImportError('Ukuran hasil ekstraksi DOCX melebihi batas aman.')
    }
  }

  if (!zip.file('[Content_Types].xml') || !zip.file('word/document.xml')) {
    throw new DocxImportError('Dokumen tidak memiliki struktur DOCX yang lengkap.')
  }
}

function docxStyleMap() {
  return [
    'p.Title => h1.docx-title:fresh',
    'p.Heading1 => h1.docx-heading-1:fresh',
    'p.Heading2 => h3.docx-heading-2:fresh',
    'p.Heading3 => h3.docx-heading-3:fresh',
    'p.Heading4 => h3.docx-heading-4:fresh',
    'p.Heading5 => h3.docx-heading-5:fresh',
    'p.Heading6 => h3.docx-heading-6:fresh',
    "p[style-name='Title'] => h1.docx-title:fresh",
    "p[style-name='Heading 1'] => h1.docx-heading-1:fresh",
    "p[style-name='Heading 2'] => h3.docx-heading-2:fresh",
    "p[style-name='Heading 3'] => h3.docx-heading-3:fresh",
    "p[style-name='Heading 4'] => h3.docx-heading-4:fresh",
    "p[style-name='Heading 5'] => h3.docx-heading-5:fresh",
    "p[style-name='Heading 6'] => h3.docx-heading-6:fresh",
    "p[style-name='heading 1'] => h1.docx-heading-1:fresh",
    "p[style-name='heading 2'] => h3.docx-heading-2:fresh",
    "p[style-name='heading 3'] => h3.docx-heading-3:fresh",
    "p[style-name='heading 4'] => h3.docx-heading-4:fresh",
    "p[style-name='heading 5'] => h3.docx-heading-5:fresh",
    "p[style-name='heading 6'] => h3.docx-heading-6:fresh",
    "p[style-name='Caption'] => p.docx-caption:fresh",
    "p[style-name='Image Caption'] => p.docx-caption:fresh",
  ]
}

export async function importDocxSubmission(file: File): Promise<DocxImportResult> {
  if (file.type !== DOCX_MIME || !file.name.toLowerCase().endsWith('.docx')) {
    throw new DocxImportError('Pilih file DOCX untuk menggunakan impor ke editor.')
  }
  const signature = await validateDocumentSignature(file)
  if (!signature.valid) throw new DocxImportError(signature.error || 'File DOCX tidak valid.')
  const buffer = Buffer.from(await file.arrayBuffer())
  await validateDocxPackage(buffer)
  const warnings: string[] = []
  let imageCount = 0
  const importSessionId = randomUUID()
  const importedImages: Array<{ publicId: string; url: string }> = []
  const uploadedPublicIds: string[] = []

  try {
    const result = await mammoth.convertToHtml(
      { buffer },
      {
        externalFileAccess: false,
        includeDefaultStyleMap: true,
        styleMap: docxStyleMap(),
        convertImage: mammoth.images.imgElement(async (image) => {
          imageCount += 1
          if (imageCount > MAX_IMPORTED_IMAGES) {
            warnings.push('Gambar ke-' + imageCount + ' dilewati karena batas ' + MAX_IMPORTED_IMAGES + ' gambar tercapai.')
            return { src: '' }
          }
          const altText = (((image as typeof image & { altText?: string }).altText) || '').trim()
          if (!altText) {
            warnings.push('Gambar ke-' + imageCount + ' dilewati karena tidak memiliki teks alternatif. Tambahkan alt text secara manual jika diperlukan.')
            return { src: '' }
          }
          if (!ALLOWED_IMAGE_TYPES.includes(image.contentType)) {
            warnings.push('Gambar ke-' + imageCount + ' dilewati karena formatnya tidak didukung.')
            return { src: '' }
          }
          try {
            const imageBuffer = await image.readAsBuffer()
            if (imageBuffer.byteLength > MAX_IMAGE_SIZE) throw new Error('Ukuran gambar melebihi 2 MB.')
            const imageBytes = new Uint8Array(imageBuffer.byteLength)
            imageBytes.set(imageBuffer)
            const imageFile = new File([imageBytes.buffer], 'docx-image-' + imageCount + '.' + (image.contentType.split('/')[1] || 'bin'), { type: image.contentType })
            const validation = await validateImageSignature(imageFile)
            if (!validation.valid) throw new Error(validation.error || 'Signature gambar tidak valid.')
            const uploaded = await storageService.uploadDocxImportImage(imageFile, importSessionId)
            uploadedPublicIds.push(uploaded.publicId)
            importedImages.push({ publicId: uploaded.publicId, url: uploaded.secureUrl })
            return { src: uploaded.secureUrl }
          } catch (error) {
            warnings.push('Gambar ke-' + imageCount + ' dilewati karena gagal diunggah: ' + (error instanceof Error ? error.message : 'kesalahan tidak diketahui'))
            return { src: '' }
          }
        }),
      },
    )

    const errors = result.messages.filter((message) => message.type === 'error')
    if (errors.length) throw new DocxImportError('Struktur DOCX tidak dapat dibaca dengan aman.')
    warnings.push(...result.messages.filter((message) => message.type === 'warning').map((message) => message.message))
    const root = parse5.parseFragment(result.value)
    const normalized = normalizeBody(root)
    if (!normalized.title && !normalized.html.trim()) {
      throw new DocxImportError('Dokumen DOCX tidak memiliki konten yang dapat diimpor.')
    }
    return {
      ...normalized,
      warnings: [...new Set(warnings)],
      importSessionId,
      importAssetManifest: createDocxImportAssetManifest(importSessionId, importedImages.map((image) => ({ publicId: image.publicId, url: image.url }))),
      importedImages,
    }
  } catch (error) {
    await rollbackImportedImages(importSessionId, uploadedPublicIds)
    throw error
  }
}
