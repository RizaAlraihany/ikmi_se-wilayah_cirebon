import { AuditAction } from '@prisma/client'

export type EventMap = {
  'finance.requested': { id: string }
  'finance.approved.tier1': { id: string }
  'finance.completed': { id: string }
  'finance.rejected': { id: string }
  
  'post.submitted': { postId: string; authorId: string }
  
  'registration.created': { registrationId: string }
  'registration.approved': { registrationId: string }
  'registration.rejected': { registrationId: string }

  'lpj.submitted': { id: string }
  'lpj.verified.department': { id: string }
  'lpj.verified.bph': { id: string }
  'lpj.rejected': { id: string }

  'complaint.created': { complaintId: string }
  'complaint.assigned': { complaintId: string; assignedTo?: string }
  'complaint.closed': { complaintId: string; status: string }

  'agenda.reminder.sent': { eventId: string; title: string }
  'finance.reminder.sent': { requestId: string; amount: string }
  'lpj.overdue': { eventId: string; title: string }
  
  'audit.log': { 
    action: AuditAction | 'UPDATE_STATUS' | 'CREATE' | 'UPDATE' | 'DELETE' | 'APPROVE' | 'REJECT' | 'PUBLISH' | 'VERIFY' | 'LOGIN' | 'LOGOUT'
    entity: string
    entityId: string
    oldData?: string
    newData?: string
    userId?: string
  }
}

export type EventName = keyof EventMap

export type EventHandler<T extends EventName> = (payload: EventMap[T]) => void | Promise<void>
