module.exports = {
  extends: ['@celo/eslint-config-typescript'],
  // The @typescript-eslint/no-floating-promises and @typescript-eslint/no-misused-promises
  // plugins require a full compilation, so pass the `tsconfig.json` config file.
  parserOptions: {
    project: './tsconfig.eslint.json',
  },
  ignorePatterns: ['**/__mocks__/**', '**/lcov-report/**', 'vendor', '.bundle'],
}
