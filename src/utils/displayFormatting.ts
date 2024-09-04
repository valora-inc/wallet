// Ref: https://github.com/celo-org/developer-tooling/blob/5cfd16214ca7ef7a7ff428c7d397933b3e1eeb51/packages/sdk/base/src/displayFormatting.ts#L2
export function getErrorMessage(error: Error) {
  // This replacement is because when the error reaches here, it's been wrapped
  // by Error: multiple times
  let errorMsg = error.message || error.name || 'unknown'
  errorMsg = errorMsg.replace(/Error:/g, '')
  if (error.stack) {
    errorMsg += ' in ' + error.stack.substring(0, 100)
  }
  return errorMsg
}
