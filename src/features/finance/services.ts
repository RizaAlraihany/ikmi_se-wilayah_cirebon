import { financeRepository } from './repository'

// Dipertahankan untuk referensi internal jika diperlukan
export const financeService = {
  async getSummary() {
    return financeRepository.getSummary()
  },
}
