import { announcementRepository } from './repository'

export const announcementQueries = {
  async getAnnouncements(skip = 0, take = 20) {
    return announcementRepository.findMany(skip, take)
  },

  async getAnnouncementById(id: string) {
    return announcementRepository.findById(id)
  },

  async getCount() {
    return announcementRepository.count()
  },

  async getLatest(take = 3) {
    return announcementRepository.findMany(0, take)
  },
}
