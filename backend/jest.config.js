module.exports = {
  rootDir: './src',
  testEnvironment: 'node',
  verbose: true,
  testMatch: ['**/tests/**/*.test.js'],
  setupFiles: ['./tests/setup-env.js'],

  moduleNameMapper: {
    '^@src/(.*)$': '<rootDir>/$1',
  },

  collectCoverageFrom: [
    '**/*.js',
    '!tests/**',
    '!node_modules/**'
  ],
  coverageDirectory: '../coverage',
  coverageThreshold: {
    global: {
      branches: 75,
      functions: 75,
      lines: 75,
      statements: 75,
    },
  },
};
