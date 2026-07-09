import { financeService } from '@/features/finance/services'
import { financeRepository } from '@/features/finance/repository'

jest.mock('@/features/finance/repository', () => ({
  financeRepository: {
    getSummary: jest.fn()
  }
}))

describe('Finance Service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getSummary', () => {
    it('should return summary from repository', async () => {
      ;(financeRepository.getSummary as jest.Mock).mockResolvedValueOnce({
        totalIncome: 10000,
        totalExpense: 5000,
        balance: 5000
      })

      const result = await financeService.getSummary()

      expect(financeRepository.getSummary).toHaveBeenCalled()
      expect(result).toEqual({
        totalIncome: 10000,
        totalExpense: 5000,
        balance: 5000
      })
    })
  })
})
