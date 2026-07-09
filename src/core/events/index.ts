export * from './event-bus'
export * from './event-types'
import { registerEventHandlers } from './handlers'

// Auto-register handlers when this module is first imported
let initialized = false

if (!initialized) {
  registerEventHandlers()
  initialized = true
}
