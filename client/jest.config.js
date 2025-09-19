// jest.config.js
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './src/',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/src/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testPathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/node_modules/'],
  // Gunakan preset yang benar
  preset: 'ts-jest',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.ts',
    '<rootDir>/src/**/__tests__/**/*.tsx',
    '<rootDir>/src/**/?(*.)+(spec|test).ts',
    '<rootDir>/src/**/?(*.)+(spec|test).tsx',
  ],
  globals: {
    'ts-jest': {
      tsconfig: {
        path: '<rootDir>/tsconfig.json',
      },
    },
  },
}

module.exports = createJestConfig(customJestConfig)