'use server'

import { revalidatePath } from 'next/cache'
import { membershipService, KaderisasiNotes } from './services'
import { auth } from '@/core/auth/auth'
import { can } from '@/core/authorization/rbac'
import type { SessionUser } from '@/core/authorization/rbac'

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Terjadi kesalahan'
}

function getSessionUser(user: { id?: string; roleId: string; departmentId: string | null; positionId: string | null }): SessionUser {
  if (!user.id) {
    throw new Error('Unauthorized')
  }
  return {
    id: user.id,
    roleId: user.roleId,
    departmentId: user.departmentId,
    positionId: user.positionId,
  }
}

export async function verifyRegistrationAction(
  id: string,
  status: 'APPROVED' | 'REJECTED',
  notes: KaderisasiNotes
) {
  try {
    const session = await auth()
    if (!session || !session.user) throw new Error('Unauthorized')
    const user = getSessionUser(session.user)
    
    // RBAC Check
    const hasAccess = await can(status === 'APPROVED' ? 'registration.approve' : 'registration.reject', user)
    if (!hasAccess) throw new Error('Forbidden')

    await membershipService.verifyRegistration(id, status, notes, user.id)
    revalidatePath('/dashboard/kaderisasi')
    revalidatePath('/dashboard/membership')
    return { success: true }
  } catch (error: unknown) {
    return { success: false, error: errorMessage(error) }
  }
}

export async function addKaderisasiNoteAction(registrationId: string, noteType: string, content: string) {
  try {
    const session = await auth()
    if (!session || !session.user) throw new Error('Unauthorized')
    const user = getSessionUser(session.user)
    
    // RBAC Check
    const hasAccess = await can('registration.approve', user)
    if (!hasAccess) throw new Error('Forbidden')

    await membershipService.addKaderisasiNote(registrationId, noteType, content, user.id)
    revalidatePath('/dashboard/kaderisasi')
    revalidatePath(`/dashboard/kaderisasi/${registrationId}`)
    return { success: true }
  } catch (error: unknown) {
    return { success: false, error: errorMessage(error) }
  }
}

export async function promoteToActiveAction(registrationId: string) {
  try {
    const session = await auth()
    if (!session || !session.user) throw new Error('Unauthorized')
    const user = getSessionUser(session.user)
    
    const hasAccess = await can('member.promote', user)
    if (!hasAccess) throw new Error('Forbidden')

    await membershipService.promoteToActive(registrationId, user.id)
    revalidatePath('/dashboard/kaderisasi')
    revalidatePath('/dashboard/membership')
    return { success: true }
  } catch (error: unknown) {
    return { success: false, error: errorMessage(error) }
  }
}

export async function promoteToManagementAction(userId: string, positionId: string, departmentId: string) {
  try {
    const session = await auth()
    if (!session || !session.user) throw new Error('Unauthorized')
    const user = getSessionUser(session.user)
    
    const hasAccess = await can('member.promote', user)
    if (!hasAccess) throw new Error('Forbidden')

    await membershipService.promoteToManagement(userId, positionId, departmentId, user.id)
    revalidatePath('/dashboard/membership')
    revalidatePath(`/dashboard/membership/${userId}`)
    return { success: true }
  } catch (error: unknown) {
    return { success: false, error: errorMessage(error) }
  }
}

export async function demoteToDemisionerAction(userId: string) {
  try {
    const session = await auth()
    if (!session || !session.user) throw new Error('Unauthorized')
    const user = getSessionUser(session.user)
    
    const hasAccess = await can('member.promote', user)
    if (!hasAccess) throw new Error('Forbidden')

    await membershipService.demoteToDemisioner(userId, user.id)
    revalidatePath('/dashboard/membership')
    revalidatePath(`/dashboard/membership/${userId}`)
    return { success: true }
  } catch (error: unknown) {
    return { success: false, error: errorMessage(error) }
  }
}

export async function promoteToAlumniAction(userId: string) {
  try {
    const session = await auth()
    if (!session || !session.user) throw new Error('Unauthorized')
    const user = getSessionUser(session.user)
    
    const hasAccess = await can('member.promote', user)
    if (!hasAccess) throw new Error('Forbidden')

    await membershipService.promoteToAlumni(userId, user.id)
    revalidatePath('/dashboard/membership')
    revalidatePath(`/dashboard/membership/${userId}`)
    return { success: true }
  } catch (error: unknown) {
    return { success: false, error: errorMessage(error) }
  }
}

export async function bulkVerifyRegistrationAction(
  ids: string[],
  status: 'APPROVED' | 'REJECTED',
  notes: KaderisasiNotes
) {
  try {
    const session = await auth()
    if (!session || !session.user) throw new Error('Unauthorized')
    const user = getSessionUser(session.user)
    
    const hasAccess = await can(status === 'APPROVED' ? 'registration.approve' : 'registration.reject', user)
    if (!hasAccess) throw new Error('Forbidden')

    const results = await Promise.allSettled(
      ids.map(id => membershipService.verifyRegistration(id, status, notes, user.id))
    )
    
    revalidatePath('/dashboard/kaderisasi')
    revalidatePath('/dashboard/membership')
    return { success: true, results: results.map(r => r.status) }
  } catch (error: unknown) {
    return { success: false, error: errorMessage(error) }
  }
}

export async function bulkPromoteToActiveAction(ids: string[]) {
  try {
    const session = await auth()
    if (!session || !session.user) throw new Error('Unauthorized')
    const user = getSessionUser(session.user)
    
    const hasAccess = await can('member.promote', user)
    if (!hasAccess) throw new Error('Forbidden')

    const results = await Promise.allSettled(
      ids.map(id => membershipService.promoteToActive(id, user.id))
    )
    
    revalidatePath('/dashboard/kaderisasi')
    revalidatePath('/dashboard/membership')
    return { success: true, results: results.map(r => r.status) }
  } catch (error: unknown) {
    return { success: false, error: errorMessage(error) }
  }
}

export async function bulkPromoteToManagementAction(userIds: string[], positionId: string, departmentId: string) {
  try {
    const session = await auth()
    if (!session || !session.user) throw new Error('Unauthorized')
    const user = getSessionUser(session.user)
    
    const hasAccess = await can('member.promote', user)
    if (!hasAccess) throw new Error('Forbidden')

    const results = await Promise.allSettled(
      userIds.map(id => membershipService.promoteToManagement(id, positionId, departmentId, user.id))
    )
    
    revalidatePath('/dashboard/membership')
    return { success: true, results: results.map(r => r.status) }
  } catch (error: unknown) {
    return { success: false, error: errorMessage(error) }
  }
}
