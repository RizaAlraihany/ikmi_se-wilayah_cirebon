import { WhatsappMessageStatus } from '@prisma/client'
import {
  buildPamfletNotificationMessage,
  getActiveAdminKomdigiRecipients,
  notifyAdminKomdigiPamfletRequest,
  sendWhatsappMessage,
} from '@/features/notification/whatsapp'
import { prismaMock } from '../prisma-mock'

jest.mock('@/core/monitoring/logger', () => ({
  logger: { error: jest.fn(), warn: jest.fn() },
}))

const notification = {
  id: 'request-1',
  requestNumber: 'REQ-PAMFLET-2026-0041',
  activityName: 'PRABUMI',
  requesterName: 'Siti Nurhaliza',
  requesterUnit: 'Kaderisasi',
  deadline: new Date('2026-10-01T17:00:00.000Z'),
}

const fetchMock = jest.fn()
const originalFetch = global.fetch
const originalEnvironment = {
  token: process.env.FONNTE_TOKEN,
  recipients: process.env.ADMIN_KOMDIGI_WA_RECIPIENTS,
  legacyRecipients: process.env.ADMIN_KOMDIGI_WA_NUMBERS,
  authUrl: process.env.AUTH_URL,
}

function restoreEnvironment(name: string, value: string | undefined) {
  if (value === undefined) delete process.env[name]
  else process.env[name] = value
}

describe('Request Pamflet WhatsApp notification', () => {
  beforeAll(() => {
    global.fetch = fetchMock as typeof fetch
  })

  afterAll(() => {
    global.fetch = originalFetch
    restoreEnvironment('FONNTE_TOKEN', originalEnvironment.token)
    restoreEnvironment('ADMIN_KOMDIGI_WA_RECIPIENTS', originalEnvironment.recipients)
    restoreEnvironment('ADMIN_KOMDIGI_WA_NUMBERS', originalEnvironment.legacyRecipients)
    restoreEnvironment('AUTH_URL', originalEnvironment.authUrl)
  })

  beforeEach(() => {
    delete process.env.FONNTE_TOKEN
    delete process.env.ADMIN_KOMDIGI_WA_RECIPIENTS
    delete process.env.ADMIN_KOMDIGI_WA_NUMBERS
    process.env.AUTH_URL = 'https://dashboard.ikmicirebon.web.id'
    prismaMock.$transaction.mockImplementation((async (callback: unknown) => {
      if (typeof callback !== 'function') throw new Error('Expected interactive transaction')
      return callback(prismaMock)
    }) as never)
    prismaMock.$executeRaw.mockResolvedValue(1)
  })

  it('uses only unique active recipients from trusted server configuration', () => {
    process.env.ADMIN_KOMDIGI_WA_RECIPIENTS = JSON.stringify([
      { name: 'Admin Satu', number: '0812-3456-7890', active: true },
      { name: 'Admin Nonaktif', number: '0813-0000-0000', active: false },
      { name: 'Duplikat', number: '6281234567890', active: true },
      { name: 'Admin Dua', number: '62814 1111 2222' },
      { name: 'Invalid', number: 'abc', active: true },
    ])

    expect(getActiveAdminKomdigiRecipients()).toEqual([
      { name: 'Admin Satu', number: '6281234567890', active: true },
      { name: 'Admin Dua', number: '6281411112222', active: true },
    ])
  })

  it('builds the required message with Jakarta deadline and dashboard detail link', () => {
    const message = buildPamfletNotificationMessage(notification)
    expect(message).toContain('REQUEST PAMFLET BARU')
    expect(message).toContain('REQ-PAMFLET-2026-0041')
    expect(message).toContain('Kegiatan: PRABUMI')
    expect(message).toContain('Deadline: 2 Oktober 2026')
    expect(message).toContain('https://dashboard.ikmicirebon.web.id/admin/request-pamflet/request-1')
  })

  it('claims once, stores provider metadata, and marks an accepted message successful', async () => {
    process.env.FONNTE_TOKEN = 'server-only-test-token'
    prismaMock.whatsappMessageLog.findUnique.mockResolvedValueOnce(null)
    prismaMock.whatsappMessageLog.create.mockResolvedValueOnce({ id: 'delivery-1' } as never)
    prismaMock.whatsappMessageLog.update.mockResolvedValue({ id: 'delivery-1' } as never)
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ status: true, id: ['80367170'], requestid: 2937124 }),
    })
    const now = new Date('2026-08-12T05:00:00.000Z')

    await expect(sendWhatsappMessage('6281234567890', 'Pesan', 'delivery-key', now)).resolves.toEqual({
      success: true,
      providerMessageId: '80367170',
    })
    expect(prismaMock.whatsappMessageLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        recipient: '6281234567890',
        idempotencyKey: 'delivery-key',
        status: WhatsappMessageStatus.PENDING,
        attemptCount: 1,
        lastAttemptAt: now,
      }),
    })
    expect(fetchMock).toHaveBeenCalledWith('https://api.fonnte.com/send', expect.objectContaining({
      method: 'POST',
      headers: expect.objectContaining({ Authorization: 'server-only-test-token' }),
    }))
    expect(prismaMock.whatsappMessageLog.update).toHaveBeenLastCalledWith({
      where: { idempotencyKey: 'delivery-key' },
      data: {
        status: WhatsappMessageStatus.SUCCESS,
        providerMessageId: '80367170',
        sentAt: now,
        failedAt: null,
        errorMessage: null,
      },
    })
  })

  it('persists FAILED when the server-only provider token is missing', async () => {
    prismaMock.whatsappMessageLog.findUnique.mockResolvedValueOnce(null)
    prismaMock.whatsappMessageLog.create.mockResolvedValueOnce({ id: 'delivery-2' } as never)
    prismaMock.whatsappMessageLog.update.mockResolvedValue({ id: 'delivery-2' } as never)
    const now = new Date('2026-08-12T05:00:00.000Z')

    const result = await sendWhatsappMessage('6281234567890', 'Pesan', 'failed-key', now)
    expect(result).toEqual({ success: false, error: 'FONNTE_TOKEN belum dikonfigurasi.' })
    expect(fetchMock).not.toHaveBeenCalled()
    expect(prismaMock.whatsappMessageLog.update).toHaveBeenLastCalledWith({
      where: { idempotencyKey: 'failed-key' },
      data: {
        status: WhatsappMessageStatus.FAILED,
        errorMessage: 'FONNTE_TOKEN belum dikonfigurasi.',
        failedAt: now,
      },
    })
  })

  it('does not resend a successful or currently claimed idempotency key', async () => {
    prismaMock.whatsappMessageLog.findUnique
      .mockResolvedValueOnce({ status: WhatsappMessageStatus.SUCCESS } as never)
      .mockResolvedValueOnce({
        status: WhatsappMessageStatus.PENDING,
        lastAttemptAt: new Date('2026-08-12T04:59:00.000Z'),
      } as never)
    const now = new Date('2026-08-12T05:00:00.000Z')

    await expect(sendWhatsappMessage('6281234567890', 'Pesan', 'sent-key', now)).resolves.toEqual({ success: true, reason: 'already_sent' })
    await expect(sendWhatsappMessage('6281234567890', 'Pesan', 'pending-key', now)).resolves.toEqual({ success: true, reason: 'in_progress' })
    expect(fetchMock).not.toHaveBeenCalled()
    expect(prismaMock.whatsappMessageLog.create).not.toHaveBeenCalled()
  })

  it('reclaims a failed delivery and increments its attempt count before retrying', async () => {
    prismaMock.whatsappMessageLog.findUnique.mockResolvedValueOnce({
      status: WhatsappMessageStatus.FAILED,
      lastAttemptAt: new Date('2026-08-12T04:00:00.000Z'),
    } as never)
    prismaMock.whatsappMessageLog.update.mockResolvedValue({ id: 'failed-delivery' } as never)
    const now = new Date('2026-08-12T05:00:00.000Z')

    await expect(sendWhatsappMessage('6281234567890', 'Pesan baru', 'retry-key', now)).resolves.toEqual({
      success: false,
      error: 'FONNTE_TOKEN belum dikonfigurasi.',
    })
    expect(prismaMock.whatsappMessageLog.update).toHaveBeenNthCalledWith(1, {
      where: { idempotencyKey: 'retry-key' },
      data: {
        recipient: '6281234567890',
        message: 'Pesan baru',
        status: WhatsappMessageStatus.PENDING,
        attemptCount: { increment: 1 },
        errorMessage: null,
        failedAt: null,
        lastAttemptAt: now,
      },
    })
  })

  it('delivers independently to every unique active recipient', async () => {
    process.env.FONNTE_TOKEN = 'server-only-test-token'
    process.env.ADMIN_KOMDIGI_WA_RECIPIENTS = JSON.stringify([
      { name: 'Admin Satu', number: '6281234567890', active: true },
      { name: 'Admin Dua', number: '6281411112222', active: true },
    ])
    prismaMock.whatsappMessageLog.findUnique.mockResolvedValue(null)
    prismaMock.whatsappMessageLog.create.mockResolvedValue({ id: 'delivery' } as never)
    prismaMock.whatsappMessageLog.update.mockResolvedValue({ id: 'delivery' } as never)
    fetchMock
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ status: true, id: ['message-1'] }) })
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ status: true, id: ['message-2'] }) })

    const results = await notifyAdminKomdigiPamfletRequest(notification)
    expect(results).toEqual([
      { success: true, providerMessageId: 'message-1' },
      { success: true, providerMessageId: 'message-2' },
    ])
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(prismaMock.whatsappMessageLog.create).toHaveBeenCalledTimes(2)
  })

  it('records a configuration failure when no active recipient exists', async () => {
    prismaMock.whatsappMessageLog.upsert.mockResolvedValueOnce({ id: 'configuration-log' } as never)
    await expect(notifyAdminKomdigiPamfletRequest(notification)).resolves.toEqual([
      { success: false, error: 'Tidak ada recipient Admin Komdigi aktif yang dikonfigurasi.' },
    ])
    expect(prismaMock.whatsappMessageLog.upsert).toHaveBeenCalledWith(expect.objectContaining({
      create: expect.objectContaining({
        recipient: 'NOT_CONFIGURED',
        status: WhatsappMessageStatus.FAILED,
        attemptCount: 1,
      }),
      update: expect.objectContaining({
        status: WhatsappMessageStatus.FAILED,
        attemptCount: { increment: 1 },
      }),
    }))
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
