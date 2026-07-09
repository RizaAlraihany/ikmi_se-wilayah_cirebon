import { EventName, EventMap, EventHandler } from './event-types'
import { logger } from '@/core/monitoring/logger'

class EventBus {
  private handlers: { [K in EventName]?: EventHandler<K>[] } = {}

  /**
   * Subscribe to an event
   */
  on<K extends EventName>(event: K, handler: EventHandler<K>) {
    if (!this.handlers[event]) {
      this.handlers[event] = []
    }
    this.handlers[event]!.push(handler)
  }

  /**
   * Emit an event to all subscribers
   */
  async emit<K extends EventName>(event: K, payload: EventMap[K]) {
    const eventHandlers = this.handlers[event]
    logger.workflow(event, { handlerCount: eventHandlers?.length ?? 0 })
    if (eventHandlers) {
      for (const handler of eventHandlers) {
        try {
          await handler(payload)
        } catch (error) {
          logger.error(error, { event })
        }
      }
    }
  }
}

export const eventBus = new EventBus()
