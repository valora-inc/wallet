// Ref: https://github.com/celo-org/developer-tooling/blob/4276a18e2f9bb5dfc9ef96695bae72bc67a9215b/packages/sdk/base/src/string.ts#L1
export function appendPath(baseUrl: string, path: string) {
  const lastChar = baseUrl[baseUrl.length - 1]
  if (lastChar === '/') {
    return baseUrl + path
  }
  return baseUrl + '/' + path
}
