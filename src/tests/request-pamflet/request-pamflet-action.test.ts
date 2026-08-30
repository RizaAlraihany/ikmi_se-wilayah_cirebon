import { headers } from 'next/headers'
import { after } from 'next/server'
import { RateLimitError } from '@/core/security/rate-limiter'
import { notifyAdminKomdigiPamfletRequest } from '@/features/notification/whatsapp'
import { submitRequestPamfletAction } from '@/features/request-pamflet/actions'
import { assertPamfletRequestRateLimit } from '@/features/request-pamflet/security'
import { pamfletRequestService } from '@/features/request-pamflet/services'

jest.mock('next/headers', () => ({ headers: jest.fn() }))
jest.mock('next/server', () => ({ after: jest.fn() }))
jest.mock('@/core/monitoring/logger', () => ({
  logger: { error: jest.fn(), workflow: jest.fn() },
}))
jest.mock('@/features/notification/whatsapp', () => ({
  notifyAdminKomdigiPamfletRequest: jest.fn(),
}))
jest.mock('@/features/request-pamflet/security', () => ({
  assertPamfletRequestRateLimit: jest.fn(),
  pamfletRequestClientIp: jest.fn(() => '203.0.113.10'),
}))
jest.mock('@/features/request-pamflet/services', () => ({
  pamfletRequestService: { createPublicRequest: jest.fn() },
}))

const rateLimitMock = jest.mocked(assertPamfletRequestRateLimit)
const createMock = jest.mocked(pamfletRequestService.createPublicRequest)
const afterMock = jest.mocked(after)
const notifyMock = jest.mocked(notifyAdminKomdigiPamfletRequest)
let scheduledTask: (() => Promise<unknown>) | undefined

function validFormData() {
  const formData = new FormData()
  Object.entries({
    requesterName: 'Siti Nurhaliza',
    requesterUnit: 'Kaderisasi',
    requesterWhatsapp: '081234567890',
    activityName: 'Malam Keakraban IKMI',
    eventDate: '2026-09-20',
    requestType: 'Poster',
    description: 'Cantumkan semua informasi penting kegiatan.',
    deadline: '2026-09-17',
    requesterNotes: 'Gunakan logo resmi IKMI.',
  }).forEach(([key, value]) => formData.set(key, value))
  return formData
}

describe('submitRequestPamfletAction', () => {
  beforeEach(() => {
    jest.mocked(headers).mockResolvedValue(new Headers({ 'x-forwarded-for': '203.0.113.10' }) as never)
    rateLimitMock.mockResolvedValue(undefined)
    scheduledTask = undefined
    afterMock.mockImplementation((task) => {
      if (typeof task === 'function') scheduledTask = task as () => Promise<unknown>
    })
    notifyMock.mockResolvedValue([{ success: true }])
  })

  it('rate limits before accepting a public submission', async () => {
    rateLimitMock.mockRejectedValueOnce(new RateLimitError())
    await expect(submitRequestPamfletAction(validFormData())).resolves.toEqual(expect.objectContaining({ success: false, error: expect.stringContaining('Terlalu banyak') }))
    expect(createMock).not.toHaveBeenCalled()
  })

  it('rejects the honeypot without parsing or writing', async () => {
    const formData = validFormData()
    formData.set('bot_field', 'https://spam.test')
    await expect(submitRequestPamfletAction(formData)).resolves.toEqual({ success: false, error: 'Request tidak dapat diproses.' })
    expect(createMock).not.toHaveBeenCalled()
  })

  it('returns useful field errors for invalid input', async () => {
    const formData = validFormData()
    formData.delete('eventDate')
    const result = await submitRequestPamfletAction(formData)
    expect(result).toEqual(expect.objectContaining({ success: false, fieldErrors: expect.objectContaining({ eventDate: expect.any(Array) }) }))
    expect(createMock).not.toHaveBeenCalled()
  })

  it('returns success only after the service has stored and numbered the request', async () => {
    const storedRequest = {
      id: 'request-1',
      requestNumber: 'REQ-PAMFLET-2026-0012',
      activityName: 'Malam Keakraban IKMI',
      requesterName: 'Siti Nurhaliza',
      requesterUnit: 'Kaderisasi',
      deadline: new Date('2026-09-16T17:00:00.000Z'),
    }
    createMock.mockResolvedValueOnce(storedRequest as never)
    await expect(submitRequestPamfletAction(validFormData())).resolves.toEqual({ success: true, requestNumber: 'REQ-PAMFLET-2026-0012' })
    expect(createMock).toHaveBeenCalledWith(expect.objectContaining({
      requesterWhatsapp: '6281234567890',
      requesterNotes: 'Gunakan logo resmi IKMI.',
    }), undefined)
    expect(afterMock).toHaveBeenCalledTimes(1)
    expect(notifyMock).not.toHaveBeenCalled()

    await scheduledTask?.()
    expect(notifyMock).toHaveBeenCalledWith(storedRequest)
  })

  it('keeps the saved request successful when the deferred provider fails', async () => {
    createMock.mockResolvedValueOnce({
      id: 'request-2',
      requestNumber: 'REQ-PAMFLET-2026-0013',
      activityName: 'Kajian IKMI',
      requesterName: 'Siti Nurhaliza',
      requesterUnit: 'Kaderisasi',
      deadline: new Date('2026-09-16T17:00:00.000Z'),
    } as never)
    notifyMock.mockRejectedValueOnce(new Error('provider unavailable'))

    const result = await submitRequestPamfletAction(validFormData())
    expect(result).toEqual({ success: true, requestNumber: 'REQ-PAMFLET-2026-0013' })
    await expect(scheduledTask?.()).resolves.toBeUndefined()
  })
})
