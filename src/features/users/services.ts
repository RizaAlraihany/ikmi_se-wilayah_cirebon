import { userRepository } from './repository'
import { UserCreateInput, UserUpdateInput } from './schemas'
import { prisma } from '@/core/database/prisma'
import { ForbiddenError, ValidationError, NotFoundError } from '@/core/errors/custom-errors'
import bcrypt from 'bcryptjs'
import { Prisma } from '@prisma/client'
import { requirePermissionForUser } from '@/core/authorization/guards'
import { can } from '@/core/authorization/rbac'
import { serializeAuditData } from '@/features/audit/audit-data'

type TxClient = Omit<typeof prisma, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>

export const userService = {
  async createUser(data: UserCreateInput, adminId: string) {
    await requirePermissionForUser(adminId, 'user.create')

    // 1. Validate email uniqueness
    const existing = await userRepository.findByEmail(data.email)
    if (existing) {
      throw new ValidationError('Email sudah digunakan oleh akun lain.')
    }

    // 2. Hash password
    const salt = await bcrypt.genSalt(10)
    const passwordHash = await bcrypt.hash(data.password, salt)

    // 3. Execute in transaction (Create User + Audit Log)
    return prisma.$transaction(async (tx: TxClient) => {
      const newUser = await tx.user.create({
        data: {
          name: data.name,
          email: data.email,
          passwordHash,
          roleId: data.roleId,
          departmentId: data.departmentId,
        }
      })

      await tx.auditLog.create({
        data: {
          action: 'CREATE',
          entity: 'User',
          entityId: newUser.id,
          userId: adminId,
          newData: serializeAuditData({
            name: newUser.name,
            email: newUser.email,
            roleId: newUser.roleId,
            departmentId: newUser.departmentId,
            isActive: newUser.isActive,
          }),
        }
      })

      return newUser
    })
  },

  async updateUser(data: UserUpdateInput, adminId: string) {
    const actor = await requirePermissionForUser(adminId, 'user.update')
    const user = await userRepository.findActive({ where: { id: data.id } }).then(res => res[0])
    if (!user) {
      throw new NotFoundError('Pengguna tidak ditemukan.')
    }

    const roleChanged = data.roleId !== undefined && data.roleId !== user.roleId
    if (roleChanged && !(await can('system.manage', actor))) {
      throw new ForbiddenError('Perubahan role hanya dapat dilakukan oleh Super Admin.')
    }

    if (data.email && data.email !== user.email) {
      const existing = await userRepository.findByEmail(data.email)
      if (existing) {
        throw new ValidationError('Email sudah digunakan oleh akun lain.')
      }
    }

    const updateData: Prisma.Args<typeof prisma.user, 'update'>['data'] = {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.email !== undefined ? { email: data.email } : {}),
      ...(data.roleId !== undefined ? { roleId: data.roleId } : {}),
      ...(data.departmentId !== undefined ? { departmentId: data.departmentId } : {}),
      ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
    }

    let passwordChanged = false
    if (data.password && data.password.trim() !== '') {
      const salt = await bcrypt.genSalt(10)
      updateData.passwordHash = await bcrypt.hash(data.password, salt)
      passwordChanged = true
    }

    const accountStateChanged = data.isActive !== undefined && data.isActive !== user.isActive
    if (passwordChanged || roleChanged || accountStateChanged) {
      updateData.sessionVersion = { increment: 1 }
    }

    return prisma.$transaction(async (tx: TxClient) => {
      const updatedUser = await tx.user.update({
        where: { id: data.id },
        data: updateData
      })

      await tx.auditLog.create({
        data: {
          action: roleChanged ? 'ROLE_CHANGE' : 'UPDATE',
          entity: 'User',
          entityId: updatedUser.id,
          userId: adminId,
          oldData: serializeAuditData({
            name: user.name,
            email: user.email,
            roleId: user.roleId,
            departmentId: user.departmentId,
            isActive: user.isActive,
          }),
          newData: serializeAuditData({
            name: updatedUser.name,
            email: updatedUser.email,
            roleId: updatedUser.roleId,
            departmentId: updatedUser.departmentId,
            isActive: updatedUser.isActive,
            passwordChanged,
          }),
        }
      })

      return updatedUser
    })
  },

  async deleteUser(id: string, adminId: string) {
    await requirePermissionForUser(adminId, 'user.delete')
    if (id === adminId) {
      throw new ValidationError('Anda tidak dapat menghapus akun sendiri.')
    }

    const user = await userRepository.findActive({ where: { id } }).then(res => res[0])
    if (!user) {
      throw new NotFoundError('Pengguna tidak ditemukan.')
    }

    return prisma.$transaction(async (tx: TxClient) => {
      const deletedEmail = `${user.email}_deleted_${Math.floor(Date.now() / 1000)}`
      const deletedUser = await tx.user.update({
        where: { id },
        data: { 
          deletedAt: new Date(),
          email: deletedEmail,
          sessionVersion: { increment: 1 },
        }
      })

      await tx.auditLog.create({
        data: {
          action: 'DELETE',
          entity: 'User',
          entityId: id,
          userId: adminId,
          oldData: serializeAuditData({
            name: user.name,
            email: user.email,
            roleId: user.roleId,
            departmentId: user.departmentId,
            isActive: user.isActive,
          }),
        }
      })

      return deletedUser
    })
  }
}
