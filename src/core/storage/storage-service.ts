import { cloudinary } from './cloudinary'

export interface UploadOptions {
  folder?: string
  resourceType?: 'image' | 'raw' // raw for documents (PDF, etc)
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

  async deleteFile(publicId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      cloudinary.uploader.destroy(publicId, (error) => {
        if (error) {
          reject(error)
        } else {
          resolve()
        }
      })
    })
  }
}
