import { safeActionError } from '@/core/errors/safe-action-error'
import { ValidationError } from '@/core/errors/custom-errors'
import { logger } from '@/core/monitoring/logger'

jest.mock('@/core/monitoring/logger', () => ({ logger: { error: jest.fn() } }))

describe('safe server-action errors', () => {
  it('preserves expected validation feedback', () => {
    expect(safeActionError(new ValidationError('Judul tidak valid.'), 'Gagal.', 'test.validation'))
      .toBe('Judul tidak valid.')
  })

  it('logs but never returns unexpected infrastructure details', () => {
    const error = new Error('password=secret database statement failed at C:\\internal\\server.ts')

    expect(safeActionError(error, 'Permintaan belum dapat diproses.', 'test.infrastructure'))
      .toBe('Permintaan belum dapat diproses.')
    expect(logger.error).toHaveBeenCalledWith(error, { workflow: 'test.infrastructure' })
  })
})
