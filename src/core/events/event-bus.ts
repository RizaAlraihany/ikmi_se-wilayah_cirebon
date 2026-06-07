import { EventName, EventMap, EventHandler } from './event-types'

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
    if (eventHandlers) {
      for (const handler of eventHandlers) {
        try {
          await handler(payload)
        } catch (error) {
          console.error(`Error executing event handler for ${event}:`, error)
        }
      }
    }
  }
}

export const eventBus = new EventBus()
