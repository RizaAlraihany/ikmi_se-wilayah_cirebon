import { userRepository } from './repository'
import { UserCreateInput, UserUpdateInput } from './schemas'
import { prisma } from '@/core/database/prisma'
import { ValidationError, NotFoundError } from '@/core/errors/custom-errors'
import bcrypt from 'bcryptjs'
import { Prisma } from '@prisma/client'

type TxClient = Omit<typeof prisma, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>

export const userService = {
  async createUser(data: UserCreateInput, adminId: string) {
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
          newData: JSON.stringify(newUser)
        }
      })

      return newUser
    })
  },

  async updateUser(data: UserUpdateInput, adminId: string) {
    const user = await userRepository.findActive({ where: { id: data.id } }).then(res => res[0])
    if (!user) {
      throw new NotFoundError('Pengguna tidak ditemukan.')
    }

    if (data.email && data.email !== user.email) {
      const existing = await userRepository.findByEmail(data.email)
      if (existing) {
        throw new ValidationError('Email sudah digunakan oleh akun lain.')
      }
    }

    const updateData: Prisma.Args<typeof prisma.user, 'update'>['data'] = {
      name: data.name,
      email: data.email,
      roleId: data.roleId,
      departmentId: data.departmentId,
      isActive: data.isActive
    }

    if (data.password && data.password.trim() !== '') {
      const salt = await bcrypt.genSalt(10)
      updateData.passwordHash = await bcrypt.hash(data.password, salt)
    }

    return prisma.$transaction(async (tx: TxClient) => {
      const updatedUser = await tx.user.update({
        where: { id: data.id },
        data: updateData
      })

      await tx.auditLog.create({
        data: {
          action: 'UPDATE',
          entity: 'User',
          entityId: updatedUser.id,
          userId: adminId,
          oldData: JSON.stringify(user),
          newData: JSON.stringify(updatedUser)
        }
      })

      return updatedUser
    })
  },

  async deleteUser(id: string, adminId: string) {
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
          email: deletedEmail
        }
      })

      await tx.auditLog.create({
        data: {
          action: 'DELETE',
          entity: 'User',
          entityId: id,
          userId: adminId,
          oldData: JSON.stringify(user)
        }
      })

      return deletedUser
    })
  }
}
