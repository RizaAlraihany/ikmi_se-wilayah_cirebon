import { prisma } from '@/core/database/prisma'
import { randomBytes } from 'crypto'
import { LPJTokenStatus } from '@prisma/client'

export const lpjTokenRepository = {
  async generate(data: {
    activityName: string
    description?: string
    expiredAt: Date
    generatedBy: string
  }) {
    const token = randomBytes(24).toString('hex') // 48-char hex token

    return prisma.lPJToken.create({
      data: {
        token,
        activityName: data.activityName,
        description: data.description ?? null,
        expiredAt: data.expiredAt,
        status: LPJTokenStatus.ACTIVE,
        generatedBy: data.generatedBy,
        createdBy: data.generatedBy,
      },
    })
  },

  async findByToken(token: string) {
    return prisma.lPJToken.findUnique({
      where: { token },
      include: { generator: { select: { id: true, name: true } } },
    })
  },

  async findById(id: string) {
    return prisma.lPJToken.findUnique({
      where: { id },
      include: { generator: { select: { id: true, name: true } } },
    })
  },

  async findMany(skip = 0, take = 20) {
    return prisma.lPJToken.findMany({
      where: { deletedAt: null },
      include: { generator: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    })
  },

  async consume(token: string, usedBy: string) {
    return prisma.lPJToken.update({
      where: { token },
      data: {
        status: LPJTokenStatus.USED,
        usedBy,
        usedAt: new Date(),
        updatedBy: usedBy,
      },
    })
  },

  async expireOverdue() {
    const now = new Date()
    return prisma.lPJToken.updateMany({
      where: {
        status: LPJTokenStatus.ACTIVE,
        expiredAt: { lt: now },
      },
      data: { status: LPJTokenStatus.EXPIRED },
    })
  },

  /**
   * Validasi token: cek aktif, belum dipakai, dan belum expired.
   */
  async validate(token: string): Promise<{ valid: boolean; reason?: string; data?: { id: string; activityName: string } }> {
    const record = await prisma.lPJToken.findUnique({ where: { token } })

    if (!record) return { valid: false, reason: 'Token tidak ditemukan' }
    if (record.status === 'USED') return { valid: false, reason: 'Token sudah digunakan' }
    if (record.status === 'EXPIRED') return { valid: false, reason: 'Token sudah kedaluwarsa' }
    if (record.expiredAt < new Date()) return { valid: false, reason: 'Token sudah kedaluwarsa' }

    return { valid: true, data: { id: record.id, activityName: record.activityName } }
  },
}
