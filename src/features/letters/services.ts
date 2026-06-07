import { letterRepository } from './repositories'
import { letterQueries } from './queries'
import { CreateLetterInput, UpdateLetterInput } from './schemas'
import { prisma } from '@/core/database/prisma'
import { eventBus } from '@/core/events/event-bus'
import { can, SessionUser } from '@/core/authorization/rbac'
import { ForbiddenError } from '@/core/errors/custom-errors'

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
    const isAuthorized = await can('letter.manage', user)
    if (!isAuthorized) throw new ForbiddenError('Akses ditolak: tidak dapat membuat surat')

    return prisma.$transaction(async () => {
      const letterNumber = await this.generateLetterNumber(data.type, data.date)
      
      const letter = await letterRepository.create({
        ...data,
        letterNumber
      })

      eventBus.emit('audit.log', {
        action: 'CREATE',
        entity: 'Letter',
        entityId: letter.id,
        newData: JSON.stringify(letter)
      })

      return letter
    })
  },

  async updateLetter(id: string, data: UpdateLetterInput, user: SessionUser) {
    const isAuthorized = await can('letter.manage', user)
    if (!isAuthorized) throw new ForbiddenError('Akses ditolak: tidak dapat mengubah surat')

    const updated = await letterRepository.update(id, data)
    eventBus.emit('audit.log', {
      action: 'UPDATE',
      entity: 'Letter',
      entityId: id,
      newData: JSON.stringify(updated)
    })
    return updated
  },

  async deleteLetter(id: string, user: SessionUser) {
    const isAuthorized = await can('letter.manage', user)
    if (!isAuthorized) throw new ForbiddenError('Akses ditolak: tidak dapat menghapus surat')

    const deleted = await letterRepository.delete(id)
    eventBus.emit('audit.log', {
      action: 'DELETE',
      entity: 'Letter',
      entityId: id,
      oldData: JSON.stringify(deleted)
    })
    return deleted
  }
}
