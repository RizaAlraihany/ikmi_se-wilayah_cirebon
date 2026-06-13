import { prisma } from '@/core/database/prisma'
import { waService } from '@/core/notifications/wa-service'
import { announcementRepository } from './repository'
import { CreateAnnouncementInput } from './schemas'

export const announcementService = {
  /**
   * Buat pengumuman baru.
   * Jika publish=true, otomatis blast ke WA semua user aktif yang punya nomor WA.
   */
  async createAnnouncement(input: CreateAnnouncementInput, userId: string, publish = false) {
    const announcement = await announcementRepository.create({
      title: input.title,
      content: input.content,
      publishedAt: publish ? new Date() : null,
      createdBy: userId,
    })

    await prisma.auditLog.create({
      data: {
        action: 'CREATE',
        entity: 'Announcement',
        entityId: announcement.id,
        newData: JSON.stringify({ title: input.title }),
        userId,
      },
    })

    if (publish) {
      // Fire WA blast secara async — tidak blocking response
      announcementService.blastWA(announcement.id, input.title, input.content, userId).catch((err) => {
        console.error('[AnnouncementService] WA blast error:', err)
      })
    }

    return announcement
  },

  /**
   * Publish pengumuman yang sudah ada + trigger WA blast.
   */
  async publishAnnouncement(id: string, userId: string) {
    const announcement = await announcementRepository.findById(id)
    if (!announcement) throw new Error('Pengumuman tidak ditemukan')

    await announcementRepository.update(id, {
      publishedAt: new Date(),
      updatedBy: userId,
    })

    await announcementService.blastWA(id, announcement.title, announcement.content, userId)
    return announcement
  },

  /**
   * WA Blast ke semua user aktif yang punya nomor WA.
   * Sesuai aturan AGENTS.md: trigger WA blast hanya untuk pengumuman dari Sekretaris.
   */
  async blastWA(announcementId: string, title: string, content: string, userId: string) {
    const activeUsers = await prisma.user.findMany({
      where: {
        isActive: true,
        deletedAt: null,
        whatsappNumber: { not: null },
      },
      select: { id: true, whatsappNumber: true },
    })

    const message = `📢 *Pengumuman IKMI Cirebon*\n\n*${title}*\n\n${content}\n\n_Sistem Informasi Terpadu IKMI Cirebon_`

    const messages = activeUsers
      .filter((u) => u.whatsappNumber)
      .map((u) => ({ to: u.whatsappNumber!, message }))

    if (messages.length === 0) {
      console.log('[AnnouncementService] No users with WA number to blast')
      return
    }

    const results = await waService.sendBulk(messages)
    const successCount = results.filter((r) => r.success).length

    console.log(
      `[AnnouncementService] WA blast for announcement ${announcementId}: ${successCount}/${messages.length} sent`
    )

    await announcementRepository.markWaBlasted(announcementId)

    await prisma.auditLog.create({
      data: {
        action: 'PUBLISH',
        entity: 'Announcement',
        entityId: announcementId,
        newData: JSON.stringify({ waBlasted: true, recipientCount: successCount }),
        userId,
      },
    })
  },
}
