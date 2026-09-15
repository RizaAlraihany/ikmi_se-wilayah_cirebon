// Vercel limits a function request to 4.5 MB regardless of Next's action
// bodySizeLimit. Leave room for multipart boundaries and framework metadata.
// Storage/import jobs may still process larger server-side files.
export const MAX_ACTION_PAYLOAD_BYTES = 4 * 1024 * 1024

export function actionPayloadError(data: FormData): string | null {
  let size = 0
  for (const [key, value] of data.entries()) {
    size += new Blob([key]).size + (typeof value === 'string' ? new Blob([value]).size : value.size) + 256
  }
  return size > MAX_ACTION_PAYLOAD_BYTES
    ? 'Total unggahan dan isi formulir maksimal 4 MB. Perkecil file atau isi tulisan, lalu coba kembali.'
    : null
}
