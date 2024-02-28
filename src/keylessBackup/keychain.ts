import { getPassword } from 'src/pincode/authentication'
import { retrieveStoredItem, storeItem } from 'src/storage/keychain'
import { decryptPrivateKey, encryptPrivateKey } from 'src/web3/KeychainLock'
import { Hex } from 'viem'

const SECP256K1_PRIVATE_KEY_STORAGE_KEY = 'secp256k1PrivateKey'

export async function storeSECP256k1PrivateKey(privateKey: string, walletAddress: string | null) {
  if (!walletAddress) {
    throw new Error('No account found')
  }
  const password = await getPassword(walletAddress)
  const encryptedPrivateKey = await encryptPrivateKey(privateKey, password)
  return storeItem({ key: SECP256K1_PRIVATE_KEY_STORAGE_KEY, value: encryptedPrivateKey })
}
export async function getSECP256k1PrivateKey(walletAddress: string | null) {
  if (!walletAddress) {
    throw new Error('No account found')
  }
  const password = await getPassword(walletAddress)
  const encryptedPrivateKey = await retrieveStoredItem(SECP256K1_PRIVATE_KEY_STORAGE_KEY)
  if (!encryptedPrivateKey) {
    throw new Error('No private key found in storage')
  }
  const decryptedKey = await decryptPrivateKey(encryptedPrivateKey, password)
  if (!decryptedKey) {
    throw new Error('Failed to find private key')
  }
  return decryptedKey as Hex
}
