/**
 * WA Service — WhatsApp Blast via Fonnte (atau provider sejenis)
 *
 * Arsitektur didesain modular:
 * - Interface WAProvider → mudah ganti provider tanpa ubah logic utama
 * - FonnteProvider → implementasi default menggunakan Fonnte API
 * - waService → singleton yang digunakan oleh fitur-fitur yang membutuhkan WA blast
 *
 * Trigger yang diizinkan (sesuai AGENTS.md):
 * 1. Pengumuman baru dari Sekretaris → blast ke semua user aktif
 * 2. Pendaftaran anggota baru dari web publik → link invite grup WA ke calon anggota
 */

export interface WAMessage {
  to: string    // Nomor WA (contoh: "6281234567890")
  message: string
}

export interface WAResult {
  success: boolean
  provider: string
  messageId?: string
  error?: string
}

export interface WAProvider {
  sendMessage(msg: WAMessage): Promise<WAResult>
  sendBulk(messages: WAMessage[]): Promise<WAResult[]>
}

// ─── Fonnte Provider ──────────────────────────────────────────────────────────

class FonnteProvider implements WAProvider {
  private readonly token: string
  private readonly baseUrl = 'https://api.fonnte.com'

  constructor(token: string) {
    this.token = token
  }

  async sendMessage(msg: WAMessage): Promise<WAResult> {
    try {
      const response = await fetch(`${this.baseUrl}/send`, {
        method: 'POST',
        headers: {
          Authorization: this.token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          target: msg.to,
          message: msg.message,
        }),
      })

      const data = await response.json() as { status: boolean; id?: string; reason?: string }

      if (!data.status) {
        return {
          success: false,
          provider: 'fonnte',
          error: data.reason ?? 'Unknown error from Fonnte',
        }
      }

      return {
        success: true,
        provider: 'fonnte',
        messageId: String(data.id ?? ''),
      }
    } catch (error) {
      return {
        success: false,
        provider: 'fonnte',
        error: error instanceof Error ? error.message : 'Network error',
      }
    }
  }

  async sendBulk(messages: WAMessage[]): Promise<WAResult[]> {
    // Fonnte mendukung bulk send dengan target dipisah koma
    try {
      const targets = messages.map((m) => m.to).join(',')
      const message = messages[0]?.message ?? ''

      const response = await fetch(`${this.baseUrl}/send`, {
        method: 'POST',
        headers: {
          Authorization: this.token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          target: targets,
          message,
        }),
      })

      const data = await response.json() as { status: boolean; id?: string; reason?: string }

      const result: WAResult = {
        success: data.status,
        provider: 'fonnte',
        messageId: String(data.id ?? ''),
        error: data.status ? undefined : (data.reason ?? 'Unknown error'),
      }

      return messages.map(() => ({ ...result }))
    } catch (error) {
      const errorResult: WAResult = {
        success: false,
        provider: 'fonnte',
        error: error instanceof Error ? error.message : 'Network error',
      }
      return messages.map(() => ({ ...errorResult }))
    }
  }
}

// ─── Noop Provider (untuk dev/test tanpa kredensial WA) ───────────────────────

class NoopWAProvider implements WAProvider {
  async sendMessage(msg: WAMessage): Promise<WAResult> {
    console.log(`[WA Noop] Send to ${msg.to}: ${msg.message.slice(0, 80)}...`)
    return { success: true, provider: 'noop' }
  }

  async sendBulk(messages: WAMessage[]): Promise<WAResult[]> {
    console.log(`[WA Noop] Bulk send to ${messages.length} recipients`)
    return messages.map(() => ({ success: true, provider: 'noop' }))
  }
}

// ─── Factory & Singleton ──────────────────────────────────────────────────────

function createWAProvider(): WAProvider {
  const token = process.env.FONNTE_TOKEN
  if (!token) {
    console.warn('[WAService] FONNTE_TOKEN not set — using noop provider. WA messages will NOT be sent.')
    return new NoopWAProvider()
  }
  return new FonnteProvider(token)
}

export const waService = createWAProvider()
