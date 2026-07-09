import { z } from 'zod'

const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

export const ImageSchema = z
  .any()
  .refine((file: unknown) => {
    if (typeof window === "undefined") {
      // In NodeJS (Server Action environment), File API might be slightly different or missing in older nodes, 
      // but Next.js 14 polyfills File in FormData
      return file !== null && typeof file === "object" && "size" in (file as Record<string, unknown>) && "type" in (file as Record<string, unknown>)
    }
    return file instanceof File
  }, "Input harus berupa file.")
  .refine((file: unknown) => {
    const f = file as File | { size: number, type: string }
    return f?.size <= MAX_IMAGE_SIZE
  }, `Ukuran gambar maksimal 2MB.`)
  .refine(
    (file: unknown) => {
      const f = file as File | { size: number, type: string }
      return ACCEPTED_IMAGE_TYPES.includes(f?.type)
    },
    "Hanya format .jpg, .jpeg, .png dan .webp yang diizinkan."
  );
