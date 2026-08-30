/* eslint-disable @typescript-eslint/no-require-imports */
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testEnvironment: 'jest-environment-jsdom',
  clearMocks: true,
  // Keep Jest from indexing the multi-gigabyte Next build cache. All supported
  // test locations in this project live below src/.
  roots: ['<rootDir>/src'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverage: false,
  coverageDirectory: 'coverage',
  coverageProvider: 'v8',
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/app/api/**',
  ],
  testMatch: [
    '<rootDir>/src/tests/**/*.(spec|test).ts?(x)',
    '<rootDir>/src/features/**/__tests__/**/*.(spec|test).ts?(x)',
  ],
}

module.exports = createJestConfig(customJestConfig)
