import { NextResponse } from 'next/server'
import { endOfMonth, format, startOfMonth } from 'date-fns'
import { id } from 'date-fns/locale'
import { env } from '@/core/config/env'
import { prisma } from '@/core/database/prisma'
import { logger } from '@/core/monitoring/logger'
import { waService } from '@/core/notifications/wa-service'
import {
  claimBroadcast,
  createContentPlanBroadcastKey,
  recordBroadcastResult,
} from '@/features/content-plan/broadcast-service'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  if (request.headers.get('authorization') !== `Bearer ${env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const targetNumber = env.WA_CONTENT_PLAN_TARGET
  if (!targetNumber) {
    logger.warn('Skipping content plan WhatsApp broadcast: recipient is not configured')
    return NextResponse.json({ skipped: true, reason: 'recipient_not_configured' })
  }

  try {
    const now = new Date()
    const monthStart = startOfMonth(now)
    const monthEnd = endOfMonth(now)
    const plans = await prisma.contentPlan.findMany({
      where: {
        publishDate: { gte: monthStart, lte: monthEnd },
        deletedAt: null,
      },
      include: { author: { select: { name: true } } },
      orderBy: { publishDate: 'asc' },
    })

    if (plans.length === 0) {
      return NextResponse.json({ skipped: true, reason: 'no_content_plans' })
    }

    const monthName = format(now, 'MMMM yyyy', { locale: id })
    const message = [
      '*Jadwal Content Plan Komdigi*',
      `Bulan: ${monthName}`,
      '',
      ...plans.flatMap((plan, index) => [
        `${index + 1}. *${plan.title}*`,
        `   📅 ${format(plan.publishDate, 'dd MMM (HH:mm)', { locale: id })}`,
        `   📱 ${plan.platform}`,
        `   👤 PIC: ${plan.author.name}`,
        '',
      ]),
      '_Pesan otomatis dari Sistem Terpadu IKMI Cirebon_',
    ].join('\n')

    const broadcastKey = createContentPlanBroadcastKey(format(now, 'yyyy-MM'), targetNumber)
    const claim = await claimBroadcast(broadcastKey, targetNumber)
    if (claim.kind !== 'claimed') {
      return NextResponse.json({ skipped: true, reason: claim.kind })
    }

    const result = await waService.sendMessage({ to: targetNumber, message })
    await recordBroadcastResult(claim.deliveryId, result, now)

    if (!result.success) {
      return NextResponse.json({ error: 'Failed to broadcast WhatsApp.' }, { status: 502 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error(error, { job: 'cron.wa-content-plan' })
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}