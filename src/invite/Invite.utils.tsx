import Hashid from 'hashids'

const hashid = new Hashid('some salt')

export function encodeAddress(address: string) {
  return hashid.encodeHex(Buffer.from(address, 'utf8').toString('hex'))
}

export function decodeHash(hash: string) {
  const hex = hashid.decodeHex(hash)
  return Buffer.from(hex, 'hex').toString('utf8')
}
