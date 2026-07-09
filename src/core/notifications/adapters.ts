export type NotificationDeliveryPayload = {
  recipient: string
  title: string
  message: string
  actionUrl?: string
}

export type NotificationDeliveryResult = {
  delivered: boolean
  provider: string
  messageId?: string
}

export interface EmailProvider {
  sendEmail(payload: NotificationDeliveryPayload): Promise<NotificationDeliveryResult>
}

export interface WhatsAppProvider {
  sendWhatsApp(payload: NotificationDeliveryPayload): Promise<NotificationDeliveryResult>
}

export interface PushProvider {
  sendPush(payload: NotificationDeliveryPayload): Promise<NotificationDeliveryResult>
}

export const noopEmailProvider: EmailProvider = {
  async sendEmail() {
    return { delivered: false, provider: 'noop-email' }
  },
}

export const noopWhatsAppProvider: WhatsAppProvider = {
  async sendWhatsApp() {
    return { delivered: false, provider: 'noop-whatsapp' }
  },
}

export const noopPushProvider: PushProvider = {
  async sendPush() {
    return { delivered: false, provider: 'noop-push' }
  },
}
