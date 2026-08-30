import { cloudinary } from './cloudinary'

export interface UploadOptions {
  folder?: string
  resourceType?: 'image' | 'raw' // raw for documents (PDF, etc)
  accessType?: 'upload' | 'authenticated'
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

  async uploadImage(file: File, folder: string = cloudinaryFolders.media): Promise<{ url: string; publicId: string; secureUrl: string; width?: number; height?: number }> {
    return this.uploadFile(file, { folder, resourceType: 'image' })
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
  }
}
