module.exports = {
  extends: ['@valora/eslint-config-typescript'],
  plugins: ['jsx-expressions'],
  parserOptions: {
    project: './tsconfig.eslint.json',
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
        // Turning off this rule because we don't have jest in this project yet
        // and it complains about not being able to find the version of jest
        // TODO: remove this once we add jest in this project,
        'jest/no-deprecated-functions': 'off',
      },
    },
  ],
}
