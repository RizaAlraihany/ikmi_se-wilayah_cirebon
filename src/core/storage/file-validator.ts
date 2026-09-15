export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
export const ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif']
export const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]
export const ALLOWED_DOCUMENT_EXTENSIONS = ['.pdf', '.docx']

// The dashboard action transport permits 11 MB. Ten MB is practical for
// original camera photos while retaining a small boundary below that limit.
export const MAX_IMAGE_SIZE = 10 * 1024 * 1024 // 10MB
export const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024 // 10MB

export function isHeicImageFile(file: Pick<File, 'name' | 'type'>) {
  return file.type === 'image/heic' || file.type === 'image/heif' || /\.(?:heic|heif)$/i.test(file.name)
}

function hasAllowedExtension(name: string, extensions: readonly string[]) {
  const lowerName = name.trim().toLowerCase()
  return extensions.some((extension) => lowerName.endsWith(extension))
}

function extensionFor(name: string) {
  const normalized = name.trim().toLowerCase()
  const dot = normalized.lastIndexOf('.')
  return dot >= 0 ? normalized.slice(dot) : ''
}

const imageMimeExtensions: Record<string, readonly string[]> = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
  'image/heic': ['.heic'],
  'image/heif': ['.heif'],
}

const documentMimeExtensions: Record<string, readonly string[]> = {
  'application/pdf': ['.pdf'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
}

function validateFilename(name: string) {
  if (!name.trim() || name.length > 255 || /[\u0000-\u001f\u007f]/.test(name)) {
    return { valid: false, error: 'Nama file tidak valid atau terlalu panjang.' }
  }
  return { valid: true }
}

export function validateImage(file: File): { valid: boolean; error?: string } {
  const filenameValidation = validateFilename(file.name)
  if (!filenameValidation.valid) return filenameValidation
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return { valid: false, error: 'Format gambar harus JPG, PNG, WebP, HEIC, atau HEIF.' }
  }
  if (!hasAllowedExtension(file.name, ALLOWED_IMAGE_EXTENSIONS)) {
    return { valid: false, error: 'Ekstensi gambar harus JPG, PNG, WebP, HEIC, atau HEIF.' }
  }
  if (!imageMimeExtensions[file.type]?.includes(extensionFor(file.name))) {
    return { valid: false, error: 'Ekstensi gambar tidak sesuai dengan tipe file.' }
  }
  if (file.size > MAX_IMAGE_SIZE) {
    return { valid: false, error: 'Ukuran gambar maksimal 10 MB.' }
  }
  return { valid: true }
}

export function validateDocument(file: File): { valid: boolean; error?: string } {
  const filenameValidation = validateFilename(file.name)
  if (!filenameValidation.valid) return filenameValidation
  if (!ALLOWED_DOCUMENT_TYPES.includes(file.type)) {
    return { valid: false, error: 'Format dokumen harus PDF atau DOCX.' }
  }
  if (!hasAllowedExtension(file.name, ALLOWED_DOCUMENT_EXTENSIONS)) {
    return { valid: false, error: 'Ekstensi dokumen harus PDF atau DOCX.' }
  }
  if (!documentMimeExtensions[file.type]?.includes(extensionFor(file.name))) {
    return { valid: false, error: 'Ekstensi dokumen tidak sesuai dengan tipe file.' }
  }
  if (file.size > MAX_DOCUMENT_SIZE) {
    return { valid: false, error: 'Ukuran dokumen maksimal 10 MB.' }
  }
  return { valid: true }
}

export async function validateDocumentSignature(file: File): Promise<{ valid: boolean; error?: string }> {
  const basicValidation = validateDocument(file)
  if (!basicValidation.valid) return basicValidation

  try {
    const arrayBuffer = await file.slice(0, 4).arrayBuffer()
    const bytes = new Uint8Array(arrayBuffer)
    const hex = Array.from(bytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase()

    // PDF magic bytes: 25 50 44 46
    if (file.type === 'application/pdf' && !hex.startsWith('25504446')) {
      return { valid: false, error: 'Signature file tidak valid. File mungkin rusak atau bukan PDF asli.' }
    }

    // DOCX (ZIP) magic bytes: 50 4B 03 04
    if (
      file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' &&
      !hex.startsWith('504B0304')
    ) {
      return { valid: false, error: 'Signature file tidak valid. File mungkin rusak atau bukan DOCX asli.' }
    }

    return { valid: true }
  } catch {
    return { valid: false, error: 'Gagal memvalidasi signature file.' }
  }
}

export async function validateImageSignature(file: File): Promise<{ valid: boolean; error?: string }> {
  const basicValidation = validateImage(file)
  if (!basicValidation.valid) return basicValidation

  try {
    const bytes = new Uint8Array(await file.slice(0, 64).arrayBuffer())
    const isJpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
    const isPng = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47
    const isWebp = bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46
      && bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
    const ascii = (start: number, length: number) => String.fromCharCode(...bytes.slice(start, start + length))
    // Generic mif1/msf1 brands also describe AVIF and do not prove HEIC.
    // Only inspect brands inside the declared ftyp box, never later payload.
    const heicBrands = new Set(['heic', 'heix', 'hevc', 'hevx', 'heis', 'hevm', 'hevs'])
    const boxSize = bytes.length >= 4 ? new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint32(0) : 0
    const isHeic = bytes.length >= 16 && boxSize >= 16 && boxSize <= file.size && boxSize % 4 === 0
      && ascii(4, 4) === 'ftyp'
      && (heicBrands.has(ascii(8, 4)) || Array.from({ length: Math.floor((Math.min(bytes.length, boxSize) - 16) / 4) }, (_, index) => ascii(16 + index * 4, 4)).some((brand) => heicBrands.has(brand)))

    if ((file.type === 'image/jpeg' && !isJpeg) || (file.type === 'image/png' && !isPng) || (file.type === 'image/webp' && !isWebp) || ((file.type === 'image/heic' || file.type === 'image/heif') && !isHeic)) {
      return { valid: false, error: 'Signature file gambar tidak valid.' }
    }

    return { valid: true }
  } catch {
    return { valid: false, error: 'Gagal memvalidasi signature file gambar.' }
  }
}

export async function validateImageOrDocumentSignature(file: File): Promise<{ valid: boolean; error?: string }> {
  if (ALLOWED_IMAGE_TYPES.includes(file.type)) return validateImageSignature(file)
  if (ALLOWED_DOCUMENT_TYPES.includes(file.type)) return validateDocumentSignature(file)
  return { valid: false, error: 'Format lampiran harus JPG, PNG, WebP, HEIC, HEIF, PDF, atau DOCX.' }
}

export function validateImageOrDocument(file: File): { valid: boolean; error?: string } {
  if (ALLOWED_IMAGE_TYPES.includes(file.type)) return validateImage(file)
  if (ALLOWED_DOCUMENT_TYPES.includes(file.type)) return validateDocument(file)
  return { valid: false, error: 'Format lampiran harus JPG, PNG, WebP, HEIC, HEIF, PDF, atau DOCX.' }
}
