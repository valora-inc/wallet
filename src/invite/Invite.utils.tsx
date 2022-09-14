import dynamicLinks from '@react-native-firebase/dynamic-links'
import Hashid from 'hashids'
import { Share } from 'react-native'

const hashid = new Hashid('some salt')

export function encodeAddress(address: string) {
  return hashid.encodeHex(Buffer.from(address, 'utf8').toString('hex'))
}

export function decodeHash(hash: string) {
  const hex = hashid.decodeHex(hash)
  return Buffer.from(hex, 'hex').toString('utf8')
}

export async function createDynamicLink(address: string) {
  return dynamicLinks().buildShortLink({
    link: `https://vlra.app/share/${address}`,
    domainUriPrefix: 'https://vlra.app',
  })
}

export async function share(link: string) {
  const message = `Hi! I’ve been using Valora as my crypto wallet.  It’s easy to try and I want to invite you to check it out with this link: ${link}`
  await Share.share({ message })
}
