# @celo/eslint-config-typescript

Shareable ESLint config for Celo TypeScript packages.

## Installing

Add the ESLint config in your package:

```
yarn add @celo/eslint-config-typescript --dev
```

and add all the [`peerDependencies`](./packages.json).

## Using

Add a script to your package.json:

```json
{
  "scripts": {
    "eslint": "eslint --ext=.tsx,.ts src/"
  }
}
```

and create a `.eslintrc.js` file:

```js
module.exports = {
  extends: ['@celo/eslint-config-typescript'],
  // The @typescript-eslint/no-floating-promises and @typescript-eslint/no-misused-promises
  // plugins require a full compilation, so pass the `tsconfig.json` config file.
  parserOptions: {
    project: './tsconfig.json',
  },
  ignorePatterns: ['**/__mocks__/**', '**/lcov-report/**', 'vendor', '.bundle'],
}
```

## Resources

ESLint [Shareable Configs](https://eslint.org/docs/developer-guide/shareable-configs).
