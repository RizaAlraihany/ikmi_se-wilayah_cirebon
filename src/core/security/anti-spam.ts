export class SpamError extends Error {
  constructor(message: string = 'Aktivitas mencurigakan terdeteksi.') {
    super(message)
    this.name = 'SpamError'
  }
}

/**
 * Memeriksa apakah input honeypot (yang seharusnya tidak terlihat dan tidak diisi oleh manusia)
 * terisi oleh bot pengirim spam.
 * 
 * @param value Nilai dari field honeypot
 */
export function checkHoneypot(value?: string | null) {
  if (value && value.trim() !== '') {
    throw new SpamError()
  }
}
