import { complaintRepository } from './repository'
import { SubmitComplaintInput, ProcessComplaintInput } from './schemas'
import { eventBus } from '@/core/events/event-bus'
import { complaintPolicies } from './policies'
import { SessionUser } from '@/core/authorization/rbac'

export class ForbiddenError extends Error {
  constructor(message = 'Akses ditolak') {
    super(message)
    this.name = 'ForbiddenError'
  }
}

export const complaintService = {
  async submitComplaint(data: SubmitComplaintInput) {
    const complaint = await complaintRepository.create(data)

    eventBus.emit('audit.log', {
      action: 'CREATE',
      entity: 'Complaint',
      entityId: complaint.id,
      newData: JSON.stringify(complaint)
    })

    eventBus.emit('complaint.created', { complaintId: complaint.id })

    return complaint
  },

  async processComplaint(id: string, data: ProcessComplaintInput, user: SessionUser) {
    const isAuthorized = await complaintPolicies.canManage(user)
    if (!isAuthorized) {
      throw new ForbiddenError('Anda tidak memiliki akses untuk memproses aduan ini')
    }

    const updatedComplaint = await complaintRepository.updateStatus(id, data)

    eventBus.emit('audit.log', {
      action: 'UPDATE_STATUS',
      entity: 'Complaint',
      entityId: id,
      newData: JSON.stringify(data),
      userId: user.id
    })

    if (data.status === 'PROCESSED') {
      eventBus.emit('complaint.assigned', { complaintId: id, assignedTo: data.assignedTo })
    } else if (data.status === 'RESOLVED' || data.status === 'REJECTED') {
      eventBus.emit('complaint.closed', { complaintId: id, status: data.status })
    }

    return updatedComplaint
  }
}
