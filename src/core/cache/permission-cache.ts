import { cache } from './cache'

export const permissionCache = {
  get: async (key: string): Promise<boolean | null> => {
    return cache.get<boolean>(`permission:${key}`)
  },

  set: async (key: string, value: boolean, ttlSeconds: number = 300): Promise<void> => {
    await cache.set(`permission:${key}`, value, ttlSeconds)
  },

  invalidate: async (key: string): Promise<void> => {
    await cache.del(`permission:${key}`)
  },
}
