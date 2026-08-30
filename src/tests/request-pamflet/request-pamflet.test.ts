import { ValidationError } from '@/core/errors/custom-errors'
import { storageService } from '@/core/storage/storage-service'
import {
  allowedPamfletStatusTransitions,
  assertPamfletStatusTransition,
  nextRequestNumber,
  parseJakartaDateOnly,
  parseRelatedEntity,
  requestNumberPrefix,
  validatePamfletStatusNotes,
} from '@/features/request-pamflet/domain'
import { getPamfletRequestFormOptions } from '@/features/request-pamflet/queries'
import { requestPamfletSchema } from '@/features/request-pamflet/schemas'
import { pamfletRequestService } from '@/features/request-pamflet/services'
import { prismaMock } from '../prisma-mock'

jest.mock('@/core/storage/storage-service', () => ({
  cloudinaryFolders: { pamfletRequests: 'pamflet-requests' },
  storageService: {
    uploadPrivateImage: jest.fn(),
    uploadPrivateDocument: jest.fn(),
    deleteFile: jest.fn(),
  },
}))

const storageMock = jest.mocked(storageService)
function signatureFile(name: string, type: string, bytes: number[]) {
  return {
    name,
    type,
    size: bytes.length,
    slice: () => ({ arrayBuffer: async () => Uint8Array.from(bytes).buffer }),
  } as unknown as File
}

const validRawInput = {
  requesterName: 'Siti Nurhaliza',
  requesterUnit: 'Kaderisasi',
  requesterWhatsapp: '0812 3456 7890',
  relatedEntity: '',
  activityName: 'Malam Keakraban IKMI',
  theme: 'Tumbuh Bersama',
  eventDate: '2026-09-20',
  eventStartTime: '08:00',
  eventEndTime: '11:30',
  location: 'Sekretariat IKMI',
  requestType: 'Poster',
  description: 'Cantumkan waktu, lokasi, dan narahubung kegiatan.',
  contactPerson: 'Siti - 081234567890',
  caption: 'Mari hadir dan bertumbuh bersama.',
  deadline: '2026-09-17',
  referenceLink: 'https://drive.google.com/example',
  requesterNotes: 'Mohon gunakan identitas visual kegiatan periode berjalan.',
  bot_field: '',
}

describe('Request Pamflet public workflow', () => {
  beforeEach(() => {
    prismaMock.$transaction.mockImplementation((async (callback: unknown) => {
      if (typeof callback !== 'function') throw new Error('Expected interactive transaction')
      return callback(prismaMock)
    }) as never)
    prismaMock.$executeRaw.mockResolvedValue(1)
    prismaMock.program.findFirst.mockResolvedValue(null)
    prismaMock.agenda.findFirst.mockResolvedValue(null)
  })

  it('validates required fields, allowlists request types, and normalizes WhatsApp', () => {
    const parsed = requestPamfletSchema.parse(validRawInput)
    expect(parsed.requesterWhatsapp).toBe('6281234567890')
    expect(requestPamfletSchema.safeParse({ ...validRawInput, eventDate: '' }).success).toBe(false)
    expect(requestPamfletSchema.safeParse({ ...validRawInput, requestType: 'Logo 3D' }).success).toBe(false)
    expect(requestPamfletSchema.safeParse({ ...validRawInput, referenceLink: 'http://example.test' }).success).toBe(false)
    expect(requestPamfletSchema.safeParse({ ...validRawInput, eventEndTime: '07:00' }).success).toBe(false)
    expect(requestPamfletSchema.safeParse({ ...validRawInput, requesterNotes: 'x'.repeat(3001) }).success).toBe(false)
  })

  it('uses Asia/Jakarta dates and the required annual request-number format', () => {
    expect(parseJakartaDateOnly('2026-09-20')).toEqual(new Date('2026-09-19T17:00:00.000Z'))
    expect(parseJakartaDateOnly('2026-02-30').getTime()).toBeNaN()
    expect(requestNumberPrefix(new Date('2026-12-31T18:00:00.000Z'))).toBe('REQ-PAMFLET-2027-')
    expect(nextRequestNumber('REQ-PAMFLET-2026-', 'REQ-PAMFLET-2026-0041')).toBe('REQ-PAMFLET-2026-0042')
    expect(nextRequestNumber('REQ-PAMFLET-2026-', null)).toBe('REQ-PAMFLET-2026-0001')
  })

  it('parses one Program or Agenda relation, never both', () => {
    expect(parseRelatedEntity('program:program-1')).toEqual({ programId: 'program-1', agendaId: null })
    expect(parseRelatedEntity('agenda:agenda-1')).toEqual({ programId: null, agendaId: 'agenda-1' })
    expect(parseRelatedEntity()).toEqual({ programId: null, agendaId: null })
    expect(() => parseRelatedEntity('member:private')).toThrow(ValidationError)
  })

  it('enforces the Request Pamflet status workflow and required operational notes', () => {
    expect(allowedPamfletStatusTransitions('BARU')).toEqual(['DITERIMA', 'DITOLAK', 'DIBATALKAN'])
    expect(() => assertPamfletStatusTransition('BARU', 'SELESAI')).toThrow(ValidationError)
    expect(() => assertPamfletStatusTransition('SELESAI', 'DIKERJAKAN')).toThrow(ValidationError)
    expect(() => assertPamfletStatusTransition('DITERIMA', 'DIKERJAKAN')).not.toThrow()
    expect(() => validatePamfletStatusNotes('PERLU_REVISI', '')).toThrow('Catatan wajib diisi')
    expect(validatePamfletStatusNotes('DITOLAK', 'Informasi kegiatan belum lengkap.')).toBe('Informasi kegiatan belum lengkap.')
  })

  it('only returns public Program and Agenda options', async () => {
    prismaMock.program.findMany.mockResolvedValueOnce([])
    prismaMock.agenda.findMany.mockResolvedValueOnce([])
    await getPamfletRequestFormOptions()
    expect(prismaMock.program.findMany).toHaveBeenCalledWith({
      where: { deletedAt: null, visibility: 'PUBLIC' },
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    })
    expect(prismaMock.agenda.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ deletedAt: null, visibility: 'PUBLIC' }),
      select: { id: true, name: true },
    }))
  })

  it('rejects hidden relations and invalid schedule before creating a record', async () => {
    const hiddenProgram = requestPamfletSchema.parse({ ...validRawInput, relatedEntity: 'program:hidden-program' })
    await expect(pamfletRequestService.createPublicRequest(hiddenProgram, undefined, new Date('2026-08-12T00:00:00.000Z'))).rejects.toThrow('tidak tersedia untuk publik')
    expect(prismaMock.program.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ visibility: 'PUBLIC' }) }))
    expect(prismaMock.pamfletRequest.create).not.toHaveBeenCalled()

    const pastDeadline = requestPamfletSchema.parse({ ...validRawInput, deadline: '2026-08-01' })
    await expect(pamfletRequestService.createPublicRequest(pastDeadline, undefined, new Date('2026-08-12T00:00:00.000Z'))).rejects.toThrow('Deadline pengerjaan tidak boleh sudah lewat')
  })

  it('saves first, serializes number generation, then assigns REQ-PAMFLET-YYYY-XXXX', async () => {
    const input = requestPamfletSchema.parse(validRawInput)
    prismaMock.pamfletRequest.create.mockResolvedValueOnce({ id: 'request-1' } as never)
    prismaMock.pamfletRequest.findFirst.mockResolvedValueOnce({ requestNumber: 'REQ-PAMFLET-2026-0011' } as never)
    prismaMock.pamfletRequest.update.mockResolvedValueOnce({ id: 'request-1', requestNumber: 'REQ-PAMFLET-2026-0012' } as never)

    await expect(pamfletRequestService.createPublicRequest(input, undefined, new Date('2026-08-12T00:00:00.000Z'))).resolves.toEqual({
      id: 'request-1',
      requestNumber: 'REQ-PAMFLET-2026-0012',
    })

    expect(prismaMock.pamfletRequest.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        requestNumber: expect.stringMatching(/^PENDING-/),
        requesterWhatsapp: '6281234567890',
        eventDate: new Date('2026-09-19T17:00:00.000Z'),
        eventTime: '08:00–11:30 WIB',
        requesterNotes: 'Mohon gunakan identitas visual kegiatan periode berjalan.',
      }),
    }))
    expect(prismaMock.$executeRaw).toHaveBeenCalledTimes(1)
    expect(prismaMock.pamfletRequest.update).toHaveBeenCalledWith({
      where: { id: 'request-1' },
      data: { requestNumber: 'REQ-PAMFLET-2026-0012' },
      select: {
        id: true,
        requestNumber: true,
        activityName: true,
        requesterName: true,
        requesterUnit: true,
        deadline: true,
      },
    })
  })

  it('stores validated uploads privately with metadata', async () => {
    const input = requestPamfletSchema.parse(validRawInput)
    const file = signatureFile('panduan.pdf', 'application/pdf', [0x25, 0x50, 0x44, 0x46])
    storageMock.uploadPrivateDocument.mockResolvedValueOnce({ url: 'private', secureUrl: 'https://res.cloudinary.com/private.pdf', publicId: 'private-id' })
    prismaMock.pamfletRequest.create.mockResolvedValueOnce({ id: 'request-file' } as never)
    prismaMock.pamfletRequest.findFirst.mockResolvedValueOnce(null)
    prismaMock.pamfletRequest.update.mockResolvedValueOnce({ id: 'request-file', requestNumber: 'REQ-PAMFLET-2026-0001' } as never)

    await pamfletRequestService.createPublicRequest(input, file, new Date('2026-08-12T00:00:00.000Z'))
    expect(storageMock.uploadPrivateDocument).toHaveBeenCalledWith(file, 'pamflet-requests')
    expect(prismaMock.pamfletRequest.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({
      attachmentUrl: 'https://res.cloudinary.com/private.pdf',
      attachmentPublicId: 'private-id',
      attachmentOriginalName: 'panduan.pdf',
      attachmentMimeType: 'application/pdf',
      attachmentSize: 4,
    }) }))
  })

  it('removes an uploaded private file when the database transaction fails', async () => {
    const input = requestPamfletSchema.parse(validRawInput)
    const file = signatureFile('referensi.jpg', 'image/jpeg', [0xff, 0xd8, 0xff])
    storageMock.uploadPrivateImage.mockResolvedValueOnce({ url: 'private', secureUrl: 'https://res.cloudinary.com/private.jpg', publicId: 'image-id' })
    prismaMock.$transaction.mockRejectedValueOnce(new Error('database unavailable'))
    storageMock.deleteFile.mockResolvedValueOnce()

    await expect(pamfletRequestService.createPublicRequest(input, file, new Date('2026-08-12T00:00:00.000Z'))).rejects.toThrow('database unavailable')
    expect(storageMock.deleteFile).toHaveBeenCalledWith('image-id', 'image', 'authenticated')
  })
})
