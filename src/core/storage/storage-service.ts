import { cloudinary } from './cloudinary'

export interface UploadOptions {
  folder?: string
  resourceType?: 'image' | 'raw' // raw for documents (PDF, etc)
  accessType?: 'upload' | 'authenticated'
  tags?: string | string[]
}

export const cloudinaryFolders = {
  users: 'users',
  blog: 'blog',
  events: 'events',
  reports: 'reports',
  letters: 'letters',
  documents: 'documents',
  media: 'media-library',
  organizations: 'organizations',
  website: 'website',
  pamfletRequests: 'pamflet-requests',
  writingSubmissions: 'writing-submissions',
} as const

export const DOCX_IMPORT_TEMP_TAG = 'ikmi-docx-import-temp'
export const DOCX_IMPORT_ROOT = `${cloudinaryFolders.writingSubmissions}/docx-imports`

const DOCX_IMPORT_SESSION_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const DOCX_IMPORT_IMAGE_EXTENSION_PATTERN = /\.(?:jpe?g|png|webp)$/i

export function isDocxImportSessionId(value: string) {
  return DOCX_IMPORT_SESSION_PATTERN.test(value)
}

export function getDocxImportFolder(sessionId: string) {
  if (!isDocxImportSessionId(sessionId)) throw new Error('Invalid DOCX import session.')
  return `${DOCX_IMPORT_ROOT}/${sessionId}`
}

export function isOwnedDocxImportPublicId(publicId: string, sessionId: string) {
  return publicId.startsWith(`ikmi/${getDocxImportFolder(sessionId)}/`)
    && !publicId.includes('..')
    && !publicId.includes('\\')
}

export function isDocxImportTemporaryUrl(value: string) {
  try {
    const url = new URL(value)
    const uploadIndex = url.pathname.indexOf('/upload/')
    const importPathIndex = url.pathname.lastIndexOf(`/ikmi/${DOCX_IMPORT_ROOT}/`)
    return url.protocol === 'https:'
      && url.hostname === 'res.cloudinary.com'
      && uploadIndex >= 0
      && importPathIndex > uploadIndex
  } catch {
    return false
  }
}

export function getDocxImportPublicIdFromUrl(value: string, sessionId: string) {
  if (!isDocxImportSessionId(sessionId)) return null
  try {
    const url = new URL(value)
    if (url.protocol !== 'https:' || url.hostname !== 'res.cloudinary.com') return null
    const publicIdPrefix = `ikmi/${getDocxImportFolder(sessionId)}/`
    const pathPrefix = `/${publicIdPrefix}`
    const uploadIndex = url.pathname.indexOf('/upload/')
    const prefixIndex = url.pathname.lastIndexOf(pathPrefix)
    if (uploadIndex < 0 || prefixIndex <= uploadIndex) return null
    const publicId = `${publicIdPrefix}${decodeURIComponent(url.pathname.slice(prefixIndex + pathPrefix.length))}`.replace(DOCX_IMPORT_IMAGE_EXTENSION_PATTERN, '')
    if (!publicId || publicId.includes('..') || publicId.includes('\\')) return null
    return isOwnedDocxImportPublicId(publicId, sessionId) ? publicId : null
  } catch {
    return null
  }
}

export function getDocxImportSessionIdFromUrl(value: string) {
  try {
    const url = new URL(value)
    const prefix = `/ikmi/${DOCX_IMPORT_ROOT}/`
    const uploadIndex = url.pathname.indexOf('/upload/')
    const prefixIndex = url.pathname.lastIndexOf(prefix)
    if (url.protocol !== 'https:' || url.hostname !== 'res.cloudinary.com' || uploadIndex < 0 || prefixIndex <= uploadIndex) return null
    const sessionId = url.pathname.slice(prefixIndex + prefix.length).split('/')[0]
    return isDocxImportSessionId(sessionId) ? sessionId : null
  } catch {
    return null
  }
}

function normalizeFolder(folder?: string) {
  return (folder || cloudinaryFolders.media).replace(/^ikmi\/?/, '').replace(/^\/+|\/+$/g, '')
}

/**
 * Storage Service
 * 
 * Implemented using Cloudinary SDK.
 * All files are stored under the "ikmi" root folder.
 */
export const storageService = {
  async uploadFile(file: File, options?: UploadOptions): Promise<{ url: string; publicId: string; secureUrl: string; width?: number; height?: number }> {
    const folderPath = normalizeFolder(options?.folder)
    const resourceType = options?.resourceType || 'auto'
    
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `ikmi/${folderPath}`,
          resource_type: resourceType,
          type: options?.accessType,
          ...(options?.tags ? { tags: options.tags } : {}),
        },
        (error, result) => {
          if (error) {
            reject(error)
          } else if (result) {
            resolve({
              url: result.url,
              secureUrl: result.secure_url,
              publicId: result.public_id,
              width: result.width,
              height: result.height,
            })
          } else {
            reject(new Error('Unknown error during upload'))
          }
        }
      )
      
      uploadStream.end(buffer)
    })
  },

  async uploadImage(file: File, folder: string = cloudinaryFolders.media, options?: Pick<UploadOptions, 'tags'>): Promise<{ url: string; publicId: string; secureUrl: string; width?: number; height?: number }> {
    return this.uploadFile(file, { folder, resourceType: 'image', ...options })
  },

  async uploadDocxImportImage(file: File, sessionId: string): Promise<{ url: string; publicId: string; secureUrl: string; width?: number; height?: number }> {
    return this.uploadFile(file, {
      folder: getDocxImportFolder(sessionId),
      resourceType: 'image',
      tags: [DOCX_IMPORT_TEMP_TAG],
    })
  },

  async uploadDocument(file: File, folder: string = cloudinaryFolders.media): Promise<{ url: string; publicId: string; secureUrl: string }> {
    return this.uploadFile(file, { folder, resourceType: 'raw' })
  },

  async uploadPrivateImage(file: File, folder: string = cloudinaryFolders.pamfletRequests): Promise<{ url: string; publicId: string; secureUrl: string }> {
    return this.uploadFile(file, { folder, resourceType: 'image', accessType: 'authenticated' })
  },

  async uploadPrivateDocument(file: File, folder: string = cloudinaryFolders.writingSubmissions): Promise<{ url: string; publicId: string; secureUrl: string }> {
    return this.uploadFile(file, { folder, resourceType: 'raw', accessType: 'authenticated' })
  },

  getPrivateFileUrl(publicId: string, resourceType: 'image' | 'raw') {
    return cloudinary.url(publicId, {
      secure: true,
      resource_type: resourceType,
      type: 'authenticated',
      sign_url: true,
      expires_at: Math.floor(Date.now() / 1000) + 5 * 60,
    })
  },

  getPrivateDocumentUrl(publicId: string) {
    return this.getPrivateFileUrl(publicId, 'raw')
  },

  async deleteFile(
    publicId: string,
    resourceType: 'image' | 'raw' = 'image',
    accessType: 'upload' | 'authenticated' = 'upload',
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      cloudinary.uploader.destroy(publicId, { resource_type: resourceType, type: accessType }, (error) => {
        if (error) {
          reject(error)
        } else {
          resolve()
        }
      })
    })
  },

  async deleteDocxImportAssets(sessionId: string, keepPublicIds: string[] = []): Promise<void> {
    const folder = getDocxImportFolder(sessionId)
    const ownedKeepIds = new Set(keepPublicIds.filter((publicId) => isOwnedDocxImportPublicId(publicId, sessionId)))

    const removeTemporaryTag = (publicId: string) => new Promise<void>((resolve, reject) => {
      cloudinary.uploader.remove_tag(DOCX_IMPORT_TEMP_TAG, [publicId], { resource_type: 'image', type: 'upload' }, (error) => error ? reject(error) : resolve())
    })

    // Transition retained assets first. If listing or deleting abandoned
    // assets fails afterwards, a referenced image is already protected from
    // the stale sweep and can be safely retried later.
    await Promise.all([...ownedKeepIds].map(removeTemporaryTag))
    const response = await cloudinary.api.resources({
      resource_type: 'image',
      type: 'upload',
      prefix: `ikmi/${folder}/`,
      max_results: 100,
      tags: true,
    }) as { resources?: Array<{ public_id: string; tags?: string[] }> }
    const temporaryResources = (response.resources || []).filter((resource) => {
      return isOwnedDocxImportPublicId(resource.public_id, sessionId)
        && resource.tags?.includes(DOCX_IMPORT_TEMP_TAG)
    })
    await Promise.all(temporaryResources.map(async (resource) => {
      if (!ownedKeepIds.has(resource.public_id)) {
        await this.deleteFile(resource.public_id, 'image', 'upload')
      }
    }))
  },

  async cleanupStaleDocxImportAssets(olderThan: Date, protectedPublicIds: string[] = []): Promise<void> {
    const protectedIds = new Set(protectedPublicIds)
    const response = await cloudinary.api.resources({
      resource_type: 'image',
      type: 'upload',
      prefix: `ikmi/${DOCX_IMPORT_ROOT}/`,
      max_results: 500,
      tags: true,
      direction: 'asc',
    }) as { resources?: Array<{ public_id: string; created_at?: string; tags?: string[] }> }
    const staleResources = (response.resources || []).filter((resource) => {
      return resource.tags?.includes(DOCX_IMPORT_TEMP_TAG)
        && typeof resource.created_at === 'string'
        && new Date(resource.created_at).getTime() < olderThan.getTime()
    })
    await Promise.all(staleResources.map(async (resource) => {
      if (protectedIds.has(resource.public_id)) {
        await new Promise<void>((resolve, reject) => {
          cloudinary.uploader.remove_tag(DOCX_IMPORT_TEMP_TAG, [resource.public_id], { resource_type: 'image', type: 'upload' }, (error) => error ? reject(error) : resolve())
        })
        return
      }
      await this.deleteFile(resource.public_id, 'image', 'upload')
    }))
  }
}
