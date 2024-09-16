// Turns '0xce10ce10ce10ce10ce10ce10ce10ce10ce10ce10'
// into ['ce10','ce10','ce10','ce10','ce10','ce10','ce10','ce10','ce10','ce10']
export function getAddressChunks(address: string) {
  return trimLeading0x(address).match(/.{1,4}/g) || []
}

export function trimLeading0x(address: string) {
  return address.startsWith('0x') ? address.slice(2) : address
}
