module.exports = {
  rootDir: './src',
  testEnvironment: 'node',
  verbose: true,
  testMatch: [
    '**/tests/unit/test_*.js',
    '**/tests/integration/test_*.js',
    '**/tests/system/test_*.js'
  ],
  setupFilesAfterEnv: ['<rootDir>/tests/setup-jest.js'],
  moduleNameMapper: {
    '^@src/(.*)$': '<rootDir>/$1',
  },
  collectCoverageFrom: [
    'controllers/**/*.js',
    'services/**/*.js',
    'utils/**/*.js',
    'middleware/**/*.js',
    'models/**/*.js',
    '!tests/**',
    '!node_modules/**',
    // Exclude intentionally empty or stub modules from coverage to focus on real logic
    '!services/chartService.js',
    '!services/notificationService.js',
    '!utils/validator.js',
    '!services/emailService.js'
  ],
  coverageDirectory: '../coverage',
  coverageThreshold: {
    global: {
      lines: 75,
      statements: 75,
    },
  },
  testTimeout: 10000,
  collectCoverage: true,
  coverageReporters: ['text', 'lcov', 'html', 'json-summary']
};
