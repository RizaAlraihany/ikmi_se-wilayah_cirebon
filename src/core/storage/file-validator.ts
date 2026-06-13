export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
export const ALLOWED_DOCUMENT_TYPES = ['application/pdf']

export const MAX_IMAGE_SIZE = 2 * 1024 * 1024 // 2MB
export const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024 // 10MB

export function validateImage(file: File): { valid: boolean; error?: string } {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return { valid: false, error: 'Invalid file type. Only JPG, PNG, and WEBP are allowed.' }
  }
  if (file.size > MAX_IMAGE_SIZE) {
    return { valid: false, error: 'File is too large. Maximum size is 2MB.' }
  }
  return { valid: true }
}

export function validateDocument(file: File): { valid: boolean; error?: string } {
  if (!ALLOWED_DOCUMENT_TYPES.includes(file.type)) {
    return { valid: false, error: 'Invalid file type. Only PDF is allowed.' }
  }
  if (file.size > MAX_DOCUMENT_SIZE) {
    return { valid: false, error: 'File is too large. Maximum size is 10MB.' }
  }
  return { valid: true }
}

export function validateImageOrDocument(file: File): { valid: boolean; error?: string } {
  if (ALLOWED_IMAGE_TYPES.includes(file.type)) return validateImage(file)
  if (ALLOWED_DOCUMENT_TYPES.includes(file.type)) return validateDocument(file)
  return { valid: false, error: 'Invalid file type. Only JPG, PNG, WEBP, and PDF are allowed.' }
}
