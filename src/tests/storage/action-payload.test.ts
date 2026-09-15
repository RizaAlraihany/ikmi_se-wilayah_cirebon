import { actionPayloadError, MAX_ACTION_PAYLOAD_BYTES } from '@/core/storage/action-payload'

describe('browser upload transport boundary', () => {
  it('accepts a normal file and bounds the entire multipart submission', () => {
    const payload = new FormData()
    payload.append('file', new File([new Uint8Array(MAX_ACTION_PAYLOAD_BYTES - 2048)], 'photo.heic'))
    expect(actionPayloadError(payload)).toBeNull()
    payload.append('content', 'x'.repeat(4096))
    expect(actionPayloadError(payload)).toContain('maksimal 4 MB')
  })
  it('rejects an oversized document before an action request can fail at the host', () => {
    const payload = new FormData()
    payload.append('file', new File([new Uint8Array(5 * 1024 * 1024)], 'article.docx'))
    expect(actionPayloadError(payload)).toContain('Perkecil file')
  })
  it('counts encoded bytes rather than JavaScript character count', () => {
    const payload = new FormData()
    payload.append('content', '字'.repeat(1_500_000))
    expect(actionPayloadError(payload)).not.toBeNull()
  })
})
