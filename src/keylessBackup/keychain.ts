import CryptoJS from 'crypto-js'
import { getPassword } from 'src/pincode/authentication'
import { retrieveStoredItem, storeItem } from 'src/storage/keychain'
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

async function encryptPrivateKey(privateKey: string, password: string) {
  return CryptoJS.AES.encrypt(privateKey, password).toString()
}

async function decryptPrivateKey(encryptedPrivateKey: string, password: string) {
  const bytes = CryptoJS.AES.decrypt(encryptedPrivateKey, password)
  return bytes.toString(CryptoJS.enc.Utf8)
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
  return decryptPrivateKey(encryptedPrivateKey, password) as Promise<Hex>
}
