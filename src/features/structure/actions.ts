'use server'

import { revalidatePath } from 'next/cache'
import { assignStructureSchema, AssignStructureInput } from './schemas'
import { structureService } from './services'
import { ORGANIZATION_DASHBOARD_ROLE_IDS } from '@/core/auth/roles'
import { requirePermission, requireRoleForUser } from '@/core/authorization/guards'
import { safeActionError } from '@/core/errors/safe-action-error'

function actionErrorMessage(error: unknown) {
  return safeActionError(error, 'Struktur organisasi belum dapat diperbarui.', 'structure.update')
}

async function requireStructureManager() {
  const user = await requirePermission('structure.manage')
  return requireRoleForUser(user, ORGANIZATION_DASHBOARD_ROLE_IDS)
}
export async function assignStructureAction(periodId: string, data: AssignStructureInput) {
  try {
    const user = await requireStructureManager()

    const parsed = assignStructureSchema.safeParse(data)
    if (!parsed.success) {
      return { success: false, message: 'Data tidak valid' }
    }

    await structureService.assignUser(periodId, parsed.data, user.id)

    revalidatePath('/admin/organization/structure')
    revalidatePath('/struktur')
    revalidatePath('/tentang-kami')
    revalidatePath('/tentang/struktur')

    return { success: true, message: 'Penugasan berhasil ditambahkan' }
  } catch (error) {
    return { success: false, message: actionErrorMessage(error) }
  }
}

export async function removeStructureAssignmentAction(assignmentId: string) {
  try {
    const user = await requireStructureManager()

    await structureService.archiveAssignment(assignmentId, user.id)

    revalidatePath('/admin/organization/structure')
    revalidatePath('/struktur')
    revalidatePath('/tentang-kami')
    revalidatePath('/tentang/struktur')

    return { success: true, message: 'Penugasan berhasil diarsipkan' }
  } catch (error) {
    return { success: false, message: actionErrorMessage(error) }
  }
}
