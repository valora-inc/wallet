// Copied from https://github.com/celo-org/celo-monorepo/blob/sdks-3.2.0/packages/sdk/base/src/string.ts

export function appendPath(baseUrl: string, path: string) {
  const lastChar = baseUrl[baseUrl.length - 1]
  if (lastChar === '/') {
    return baseUrl + path
  }
  return baseUrl + '/' + path
}

// https://stackoverflow.com/questions/990904/remove-accents-diacritics-in-a-string-in-javascript
export function normalizeAccents(str: string) {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

export const StringBase = {
  appendPath,
  normalizeAccents,
}
