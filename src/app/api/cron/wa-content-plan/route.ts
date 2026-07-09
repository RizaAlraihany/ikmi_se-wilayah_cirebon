import { NextResponse } from 'next/server'
import { prisma } from '@/core/database/prisma'
import { waService } from '@/core/notifications/wa-service'
import { startOfMonth, endOfMonth, format } from 'date-fns'
import { id } from 'date-fns/locale'

export const dynamic = 'force-dynamic' // Ensure it runs dynamically

export async function GET(request: Request) {
  try {
    // Simple authentication check for cron jobs
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    
    // In production, require CRON_SECRET if it's set
    if (process.env.NODE_ENV === 'production' && cronSecret) {
      if (authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    const now = new Date()
    const monthStart = startOfMonth(now)
    const monthEnd = endOfMonth(now)
    
    // 1. Fetch content plans for this month
    const plans = await prisma.contentPlan.findMany({
      where: {
        publishDate: {
          gte: monthStart,
          lte: monthEnd,
        },
        deletedAt: null,
      },
      include: {
        author: {
          select: { name: true }
        }
      },
      orderBy: {
        publishDate: 'asc'
      }
    })

    if (plans.length === 0) {
      return NextResponse.json({ message: 'No content plans for this month. Skipping broadcast.' })
    }

    // 3. Format Message
    const monthName = format(now, 'MMMM yyyy', { locale: id })
    
    let message = `*Jadwal Content Plan Komdigi*\n`
    message += `Bulan: ${monthName}\n\n`
    
    plans.forEach((plan, index) => {
      const dateStr = format(plan.publishDate, 'dd MMM (HH:mm)', { locale: id })
      message += `${index + 1}. *${plan.title}*\n`
      message += `   📅 ${dateStr}\n`
      message += `   📱 ${plan.platform}\n`
      message += `   👤 PIC: ${plan.author.name}\n\n`
    })
    
    message += `_Pesan otomatis dari Sistem Terpadu IKMI Cirebon_`

    const targetNumber = '083837106539'
    
    const result = await waService.sendMessage({
      to: targetNumber,
      message: message
    })

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `Successfully broadcasted to ${targetNumber}.`,
      })
    } else {
      return NextResponse.json({ error: 'Failed to broadcast WhatsApp.' }, { status: 500 })
    }
    
  } catch (error) {
    console.error('[CRON WA Content Plan]', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
