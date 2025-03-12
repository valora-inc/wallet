module.exports = {
  extends: ['@valora/eslint-config-typescript'],
  plugins: ['jsx-expressions'],
  parserOptions: {
    project: './tsconfig.json',
  },
  ignorePatterns: ['**/__mocks__/**', '**/lcov-report/**', 'vendor', '.bundle'],
  rules: {
    // Maybe move it to @valora/eslint-config-typescript?
    'jest/valid-title': ['error', { ignoreTypeOfDescribeName: true }],
    'no-console': ['error', { allow: [''] }],
  },
  overrides: [
    {
      files: ['./**/*.ts', './**/*.tsx'],
      excludedFiles: ['./**/*.test.ts', './**/*.test.tsx'],
      rules: {
        'jsx-expressions/strict-logical-expressions': 'error',
      },
    },
  ],
}
