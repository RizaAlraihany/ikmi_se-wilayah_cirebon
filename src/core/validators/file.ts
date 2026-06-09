import { z } from 'zod'

const MAX_DOC_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_DOC_TYPES = ['application/pdf'];

const MAX_PROOF_SIZE = 2 * 1024 * 1024; // 2MB
const ACCEPTED_PROOF_TYPES = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];

const isFile = (file: unknown) => {
  if (typeof window === "undefined") {
    return file !== null && typeof file === "object" && "size" in (file as Record<string, unknown>) && "type" in (file as Record<string, unknown>)
  }
  return file instanceof File
}

export const DocumentSchema = z
  .any()
  .refine(isFile, "Input harus berupa file dokumen.")
  .refine((file: unknown) => {
    const f = file as File | { size: number, type: string }
    return f?.size <= MAX_DOC_SIZE
  }, `Ukuran dokumen maksimal 10MB.`)
  .refine(
    (file: unknown) => {
      const f = file as File | { size: number, type: string }
      return ACCEPTED_DOC_TYPES.includes(f?.type)
    },
    "Hanya format .pdf yang diizinkan."
  );

export const ProofSchema = z
  .any()
  .refine(isFile, "Input harus berupa file bukti.")
  .refine((file: unknown) => {
    const f = file as File | { size: number, type: string }
    return f?.size <= MAX_PROOF_SIZE
  }, `Ukuran bukti maksimal 2MB.`)
  .refine(
    (file: unknown) => {
      const f = file as File | { size: number, type: string }
      return ACCEPTED_PROOF_TYPES.includes(f?.type)
    },
    "Hanya format .pdf, .jpg, .jpeg, dan .png yang diizinkan."
  );
