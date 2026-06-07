import { cloudinary } from './cloudinary'

export interface UploadOptions {
  folder?: string
  resourceType?: 'image' | 'raw' // raw for documents (PDF, etc)
}

/**
 * Storage Service Abstraction
 * 
 * Currently implemented using the local file system (/public/uploads)
 * for Sprint 0/1 development. 
 * 
 * TODO: Replace with Cloudinary or S3 integration for Production.
 */
export const storageService = {
  async uploadFile(file: File, options?: UploadOptions): Promise<string> {
    const folderPath = options?.folder || 'general'
    const resourceType = options?.resourceType || 'auto'
    
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `ikmi-cirebon/${folderPath}`,
          resource_type: resourceType,
        },
        (error, result) => {
          if (error) {
            reject(error)
          } else if (result) {
            resolve(result.secure_url)
          } else {
            reject(new Error('Unknown error during upload'))
          }
        }
      )
      
      uploadStream.end(buffer)
    })
  },

  async uploadImage(file: File, folder: string = 'images'): Promise<string> {
    return this.uploadFile(file, { folder, resourceType: 'image' })
  },

  async uploadDocument(file: File, folder: string = 'documents'): Promise<string> {
    return this.uploadFile(file, { folder, resourceType: 'raw' })
  }
}
