export function ensureError(value: unknown): Error {
  if (value instanceof Error) return value

  let stringified = '[Unable to stringify the thrown value]'
  try {
    stringified = JSON.stringify(value)
  } catch {
    // do nothing
  }

  const error = new Error(`Non 'Error' value thrown. Stringified value: ${stringified}`)
  return error
}
