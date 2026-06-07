import { prisma } from '@/core/database/prisma'
import { SubmitComplaintInput, ProcessComplaintInput } from './schemas'

export const complaintRepository = {
  async create(data: SubmitComplaintInput) {
    return prisma.complaint.create({
      data: {
        ...data,
        status: 'UNREAD'
      }
    })
  },

  async updateStatus(id: string, data: ProcessComplaintInput) {
    return prisma.complaint.update({
      where: { id },
      data: {
        status: data.status,
        assignedTo: data.assignedTo
      }
    })
  },
  
  async markAsProcessed(id: string) {
    return prisma.complaint.update({
      where: { id, status: 'UNREAD' },
      data: { status: 'PROCESSED' }
    })
  }
}
