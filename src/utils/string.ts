// Ref: https://github.com/celo-org/developer-tooling/blob/master/packages/sdk/base/src/string.ts#L1
export function appendPath(baseUrl: string, path: string) {
  const lastChar = baseUrl[baseUrl.length - 1]
  if (lastChar === '/') {
    return baseUrl + path
  }
  return baseUrl + '/' + path
}
