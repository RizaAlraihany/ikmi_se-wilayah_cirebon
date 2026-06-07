import { prisma } from '@/core/database/prisma'
import { ComplaintStatus } from '@prisma/client'

export const complaintQueries = {
  async getComplaints(skip = 0, take = 10, status?: ComplaintStatus) {
    return prisma.complaint.findMany({
      where: status ? { status } : undefined,
      skip,
      take,
      orderBy: { createdAt: 'desc' }
    })
  },

  async getComplaintById(id: string) {
    return prisma.complaint.findUnique({
      where: { id }
    })
  },
  
  async getUnreadCount() {
    return prisma.complaint.count({
      where: { status: 'UNREAD' }
    })
  }
}
