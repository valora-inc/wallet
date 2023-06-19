module.exports = {
  extends: ['@valora/eslint-config-typescript'],
  plugins: ['@jambit/typed-redux-saga'],
  parserOptions: {
    project: './tsconfig.eslint.json',
  },
  ignorePatterns: ['**/__mocks__/**', '**/lcov-report/**', 'vendor', '.bundle'],
  rules: {
    // Maybe move it to @valora/eslint-config-typescript?
    'jest/valid-title': ['error', { ignoreTypeOfDescribeName: true }],
    'no-console': ['error', { allow: [''] }],
    '@jambit/typed-redux-saga/use-typed-effects': 'error',
    '@jambit/typed-redux-saga/delegate-effects': 'error',
  },
}
