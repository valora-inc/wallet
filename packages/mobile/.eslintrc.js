module.exports = {
  extends: ['@valora/eslint-config-typescript'],
  parserOptions: {
    project: './tsconfig.eslint.json',
  },
  ignorePatterns: ['**/__mocks__/**', '**/lcov-report/**', 'vendor', '.bundle'],
  rules: {
    // Maybe move it to @valora/eslint-config-typescript?
    'jest/valid-title': ['error', { ignoreTypeOfDescribeName: true }],
  },
}
