module.exports = {
  extends: ['@valora/eslint-config-typescript'],
  plugins: ['@jambit/typed-redux-saga', 'jsx-expressions'],
  parserOptions: {
    project: './tsconfig.eslint.json',
  },
  ignorePatterns: ['**/__mocks__/**', '**/lcov-report/**', 'vendor', '.bundle'],
  rules: {
    // Maybe move it to @valora/eslint-config-typescript?
    'jest/valid-title': ['error', { ignoreTypeOfDescribeName: true }],
    'no-console': ['error', { allow: [''] }],
    '@jambit/typed-redux-saga/delegate-effects': 'error',
  },
  overrides: [
    {
      files: ['./**/*.ts', './**/*.tsx'],
      excludedFiles: ['./**/*.test.ts', './**/*.test.tsx'],
      rules: {
        '@jambit/typed-redux-saga/use-typed-effects': 'error',
        'jsx-expressions/strict-logical-expressions': 'error',
      },
    },
  ],
}
