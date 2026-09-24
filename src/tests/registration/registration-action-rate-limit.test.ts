import { submitRegistrationAction } from '@/features/registration/actions'
import { registrationService } from '@/features/registration/services'
import { rateLimit } from '@/core/security/rate-limiter'

jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }))
jest.mock('next/headers', () => ({ headers: jest.fn(async () => new Headers({ 'x-forwarded-for': '127.0.0.1' })) }))
jest.mock('@/core/security/rate-limiter', () => ({ rateLimit: jest.fn() }))
jest.mock('@/core/security/anti-spam', () => ({ checkHoneypot: jest.fn(), SpamError: class SpamError extends Error {} }))
jest.mock('@/features/registration/services', () => ({ registrationService: { submitRegistration: jest.fn() } }))
jest.mock('@/features/registration/access', () => ({ requireRegistrationReviewAccess: jest.fn() }))
jest.mock('@/core/errors/safe-action-error', () => ({ safeActionError: jest.fn(() => 'Pendaftaran belum dapat disimpan.') }))

const validRegistration = {
  fullName: 'Nadia Indriyani', email: 'nadia@example.test', campus: 'Universitas Cirebon', major: 'Teknik Informatika',
  semester: '3', entryYear: 2025, district: 'Jatibarang' as const, village: 'Jatibarang Baru',
  address: 'Jalan Perjuangan nomor 10, Cirebon', whatsapp: '081234567890',
  reasons: 'Saya ingin belajar dan berkontribusi bersama IKMI Cirebon.', consent: true,
}

describe('public registration submission', () => {
  beforeEach(() => jest.clearAllMocks())

  it('does not consume the submission limit for invalid form data', async () => {
    await submitRegistrationAction({ ...validRegistration, village: 'Desa tidak terdaftar' })

    expect(rateLimit).not.toHaveBeenCalled()
    expect(registrationService.submitRegistration).not.toHaveBeenCalled()
  })

  it('applies the submission limit after valid data passes validation', async () => {
    jest.mocked(registrationService.submitRegistration).mockResolvedValue({ registrationNumber: 'REG-2026-0001' } as never)

    await expect(submitRegistrationAction(validRegistration)).resolves.toMatchObject({ success: true, registrationNumber: 'REG-2026-0001' })
    expect(rateLimit).toHaveBeenCalledWith('register:127.0.0.1', 3, 3600)
    expect(registrationService.submitRegistration).toHaveBeenCalledWith(expect.objectContaining({ village: 'Jatibarang Baru' }))
  })
})
