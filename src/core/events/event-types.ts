import { AuditAction } from '@prisma/client'

export type EventMap = {
  'finance.requested': { id: string }
  'finance.approved': { id: string; tier: 'TIER1' | 'TIER2' }
  'finance.approved.tier1': { id: string }
  'finance.completed': { id: string }
  'finance.rejected': { id: string }
  
  'post.created': { postId: string; authorId: string }
  'post.submitted': { postId: string; authorId: string }
  'post.approved': { postId: string; reviewerId: string; authorId: string }
  'post.published': { postId: string; publisherId: string; authorId: string }
  'post.archived': { postId: string; userId: string; authorId: string }
  
  'registration.created': { registrationId: string }
  'registration.approved': { registrationId: string }
  'registration.rejected': { registrationId: string }
  'registration.reminder.pending': { registrationId: string }
  'member.activated': { userId: string; registrationId: string }
  'member.promoted.management': { userId: string; departmentId: string; positionId: string }
  'member.demisioner': { userId: string }
  'member.alumni': { userId: string }

  'lpj.submitted': { id: string }
  'lpj.verified': { id: string }
  'lpj.rejected': { id: string }

  'letter.created': { id: string; type: 'IN' | 'OUT'; createdBy: string }

  'complaint.created': { complaintId: string }
  'complaint.assigned': { complaintId: string; assignedTo?: string }
  'complaint.closed': { complaintId: string; status: string }

  'agenda.reminder.sent': { eventId: string; title: string; daysBefore?: number }
  'finance.reminder.sent': { requestId: string; amount: string }
  'lpj.overdue': { eventId: string; title: string }
  
  'audit.log': { 
    action: AuditAction | 'UPDATE_STATUS' | 'CREATE' | 'UPDATE' | 'DELETE' | 'APPROVE' | 'REJECT' | 'PUBLISH' | 'ARCHIVE' | 'VERIFY' | 'LOGIN' | 'LOGOUT'
    entity: string
    entityId: string
    oldData?: string
    newData?: string
    userId?: string
  }
}

export type EventName = keyof EventMap

export type EventHandler<T extends EventName> = (payload: EventMap[T]) => void | Promise<void>
