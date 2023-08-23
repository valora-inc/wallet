module.exports = {
  maxWorkers: 1,
  globalSetup: '<rootDir>/e2e/global-setup.js',
  globalTeardown: 'detox/runners/jest/globalTeardown',
  setupFilesAfterEnv: ['<rootDir>/e2e/init.js'],
  testEnvironment: '<rootDir>/e2e/environment.js',
  reporters: [
    'detox/runners/jest/reporter',
    [
      'jest-html-reporter',
      {
        pageTitle: 'E2E Test Report',
        outputPath: '<rootDir>/e2e/test-results/index.html',
        executionTimeWarningThreshold: 300,
        includeFailureMsg: true,
        styleOverridePath: 'teststyle.css',
        logo: 'valora-icon.png',
        append: true,
      },
    ],
    [
      'jest-junit',
      {
        suiteName: 'E2E Test Report',
        outputDirectory: '<rootDir>/e2e/test-results',
        outputName: 'junit.xml',
        reportTestSuiteErrors: true,
      },
    ],
  ],
  verbose: true,
  rootDir: '..',
  testMatch: ['<rootDir>/e2e/**/*.spec.js'],
  testTimeout: 300000,
  // prevent the e2e tests from using the __mocks__ we use for normal unit tests
  modulePathIgnorePatterns: ['<rootDir>/__mocks__'],
}
