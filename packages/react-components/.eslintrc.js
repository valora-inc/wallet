module.exports = {
  extends: ['@celo/eslint-config-typescript'],
  parserOptions: {
    project: './tsconfig.json',
  },
  ignorePatterns: ['**/__mocks__/**', '**/lcov-report/**', 'vendor', '.bundle'],
}
