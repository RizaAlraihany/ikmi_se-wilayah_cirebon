import {
  getPublicProgramBySlug,
  getPublicPrograms,
  orderPublicPrograms,
  programPlainText,
  publicProgramDetailSelect,
  publicProgramSummarySelect,
} from '@/features/public/public-program'
import { prismaMock } from '../prisma-mock'

describe('public Program data', () => {
  it('uses an explicit privacy allow-list and keeps every PUBLIC override discoverable', async () => {
    prismaMock.program.findMany.mockResolvedValueOnce([])

    await getPublicPrograms()

    expect(prismaMock.program.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { deletedAt: null, visibility: 'PUBLIC' },
      select: publicProgramSummarySelect,
    }))
    expect(JSON.stringify(publicProgramSummarySelect)).not.toMatch(/budget|verification|createdBy|updatedBy/i)
  })

  it('renders legacy markup as inert plain text instead of public HTML', () => {
    expect(programPlainText('<p>Tujuan aman</p><script>alert(1)</script><img src=x onerror=alert(2)>')).toBe('Tujuan aman')
    expect(programPlainText('Baris satu<br>Baris dua')).toBe('Baris satu\nBaris dua')
  })

  it('denies non-public or archived Program detail at the database boundary', async () => {
    prismaMock.program.findFirst.mockResolvedValueOnce(null)

    await expect(getPublicProgramBySlug('program-internal')).resolves.toBeNull()

    expect(prismaMock.program.findFirst).toHaveBeenCalledWith({
      where: {
        slug: 'program-internal',
        deletedAt: null,
        visibility: 'PUBLIC',
      },
      select: publicProgramDetailSelect,
    })
    expect(JSON.stringify(publicProgramDetailSelect)).not.toMatch(/budget|pic|registration|createdBy|updatedBy|author|content/i)
  })

  it('orders active and upcoming Programs before completed Programs', () => {
    const now = new Date('2026-08-11T00:00:00.000Z')
    const base = {
      slug: 'program',
      description: 'Deskripsi',
      statusOverride: null,
      location: null,
      department: { name: 'Divisi', code: 'DIV' },
    }
    const result = orderPublicPrograms([
      { ...base, id: 'completed', name: 'Selesai', plannedStart: new Date('2026-07-01T00:00:00.000Z'), plannedEnd: new Date('2026-07-02T00:00:00.000Z') },
      { ...base, id: 'upcoming', name: 'Mendatang', plannedStart: new Date('2026-09-01T00:00:00.000Z'), plannedEnd: new Date('2026-09-02T00:00:00.000Z') },
      { ...base, id: 'ongoing', name: 'Berjalan', plannedStart: new Date('2026-08-10T00:00:00.000Z'), plannedEnd: new Date('2026-08-12T00:00:00.000Z') },
    ], now)

    expect(result.map((program) => program.id)).toEqual(['ongoing', 'upcoming', 'completed'])
  })
})
