import '@testing-library/jest-dom'
import './src/tests/prisma-mock'

// Mock event bus
jest.mock('@/core/events/event-bus', () => ({
  eventBus: {
    emit: jest.fn(),
    on: jest.fn(),
  }
}))
