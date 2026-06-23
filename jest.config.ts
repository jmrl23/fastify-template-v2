import type { Config } from 'jest';

const config: Config = {
  testEnvironment: 'node',
  rootDir: 'src',
  modulePathIgnorePatterns: ['<rootDir>/build/', '<rootDir>/coverage/'],
  globalSetup: '<rootDir>/../jest.global-setup.ts',
  globalTeardown: '<rootDir>/../jest.global-teardown.ts',
  testMatch: ['**/?(*.)+(spec|test).ts'],
  moduleFileExtensions: ['ts', 'js'],
  transform: {
    '^.+\\.ts$': [
      '@swc/jest',
      {
        jsc: {
          parser: {
            syntax: 'typescript',
          },
          target: 'es2024',
        },
        module: {
          type: 'commonjs',
        },
      },
    ],
  },
  coverageProvider: 'v8',
  coverageDirectory: '<rootDir>/../coverage',
  coveragePathIgnorePatterns: ['plugins'],
  collectCoverageFrom: [
    'modules/**/*.ts',
    '!modules/**/*.spec.ts',
    '!modules/**/*.autohooks.ts',
  ],
};

export default config;
