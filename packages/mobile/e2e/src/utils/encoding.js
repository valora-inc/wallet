export function utf8ToHex(string) {
  const utf8encoder = new TextEncoder()
  const encoded = utf8encoder.encode(string)
  let result = '0x'
  for (const char of encoded) {
    result += ('0' + char.toString(16)).slice(-2)
  }
  return result
}

export function formatUri(string) {
  return device.getPlatform() === 'ios' ? string : encodeURIComponent(string)
}
