import { letterRepository } from './repository'
import { letterQueries } from './queries'
import { CreateLetterInput, UpdateLetterInput } from './schemas'
import { prisma } from '@/core/database/prisma'
import { can, SessionUser } from '@/core/authorization/rbac'
import { ForbiddenError } from '@/core/errors/custom-errors'
import { eventBus } from '@/core/events'

export const letterService = {
  async generateLetterNumber(type: 'IN' | 'OUT', date: Date): Promise<string> {
    const year = date.getFullYear()
    const latestLetter = await letterQueries.getLatestLetterNumber(type, year)
    
    let nextNum = 1
    if (latestLetter) {
      // Assuming format: 001/IN/IKMI/VI/2026
      const parts = latestLetter.letterNumber.split('/')
      if (parts.length > 0) {
        const lastSequence = parseInt(parts[0], 10)
        if (!isNaN(lastSequence)) {
          nextNum = lastSequence + 1
        }
      }
    }

    const paddedNum = nextNum.toString().padStart(3, '0')
    const romanMonths = ['I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII']
    const month = romanMonths[date.getMonth()]
    
    const entity = type === 'IN' ? 'IN' : 'OUT'
    const org = 'BEM-IKMI'

    return `${paddedNum}/${entity}/${org}/${month}/${year}`
  },

  async createLetter(data: CreateLetterInput, user: SessionUser) {
    const isAuthorized = await can('letter.create', user)
    if (!isAuthorized) throw new ForbiddenError('Akses ditolak: tidak dapat membuat surat')

    const letter = await prisma.$transaction(async () => {
      const letterNumber = await this.generateLetterNumber(data.type, data.date)
      
      const letter = await letterRepository.create({
        ...data,
        letterNumber
      })

      await prisma.auditLog.create({
        data: {
          action: 'CREATE',
          entity: 'Letter',
          entityId: letter.id,
          newData: JSON.stringify(letter),
          userId: user.id
        }
      })

      return letter
    })

    await eventBus.emit('letter.created', { id: letter.id, type: letter.type, createdBy: user.id })
    return letter
  },

  async updateLetter(id: string, data: UpdateLetterInput, user: SessionUser) {
    const isAuthorized = await can('letter.update', user)
    if (!isAuthorized) throw new ForbiddenError('Akses ditolak: tidak dapat mengubah surat')

    const letter = await prisma.letter.findUnique({ where: { id } })
    if (!letter) throw new Error('Surat tidak ditemukan')
    
    return prisma.$transaction(async (tx) => {
      const updated = await tx.letter.update({ where: { id }, data })
      await tx.auditLog.create({
        data: {
          action: 'UPDATE',
          entity: 'Letter',
          entityId: id,
          oldData: JSON.stringify(letter),
          newData: JSON.stringify(updated),
          userId: user.id
        }
      })
      return updated
    })
  },

  async deleteLetter(id: string, user: SessionUser) {
    const isAuthorized = await can('letter.delete', user)
    if (!isAuthorized) throw new ForbiddenError('Akses ditolak: tidak dapat menghapus surat')

    const letter = await prisma.letter.findUnique({ where: { id } })
    if (!letter) throw new Error('Surat tidak ditemukan')

    return prisma.$transaction(async (tx) => {
      const deleted = await tx.letter.update({
        where: { id },
        data: {
          deletedAt: new Date(),
          updatedBy: user.id,
        },
      })
      await tx.auditLog.create({
        data: {
          action: 'DELETE',
          entity: 'Letter',
          entityId: id,
          oldData: JSON.stringify(letter),
          userId: user.id
        }
      })
      return deleted
    })
  }
}
