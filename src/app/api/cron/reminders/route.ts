import { NextResponse } from 'next/server'
import { reminderJob } from '@/jobs/reminder-job'
import { env } from '@/core/config/env'

// Endpoint ini bisa dipanggil oleh cron-job.org atau vercel cron
// Menggunakan Authorization Header dengan token rahasia untuk keamanan
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  
  // Verifikasi token menggunakan env variable
  if (authHeader !== `Bearer ${env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await reminderJob.execute()

    return NextResponse.json({
      success: true,
      message: 'Cron job executed successfully',
      ...result
    })

  } catch (error) {
    console.error('Error in cron job:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
