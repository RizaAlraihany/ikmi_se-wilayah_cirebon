import { can, SessionUser } from '@/core/authorization/rbac'
import { prisma } from '@/core/database/prisma'

export const complaintPolicies = {
  async canManage(user: SessionUser) {
    // Check if the user is in Advokasi department
    const department = await prisma.department.findUnique({
      where: { id: user.departmentId ?? undefined },
      select: { name: true }
    })

    const isAdvokasi = department?.name === 'Advokasi'
    const hasPerm = await can('complaint.manage', user)

    return isAdvokasi || hasPerm
  }
}
