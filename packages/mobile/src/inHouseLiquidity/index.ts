import networkConfig from 'src/geth/networkConfig'
import { serializeSignature, signMessage } from '@celo/utils/lib/signatureUtils'
import { getStoredMnemonic } from 'src/backup/utils'
import { generateKeys } from '@celo/utils/lib/account'

export const createPersonaAccount = async (accountMTWAddress: string) => {
  const message = `post /account/create ${JSON.stringify({ accountMTWAddress })}`
  const authorization = await getAuthHeader(message, accountMTWAddress)
  return await fetch(`${networkConfig.inhouseLiquditiyUrl}/persona/account/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      authorization,
    },
    body: JSON.stringify({ accountMTWAddress }),
  })
}

// Helper Functions

const getPrivateKey = async (accountMTWAddress: string): Promise<string> => {
  const mnemonic = await getStoredMnemonic(accountMTWAddress)

  if (!mnemonic) {
    throw new Error('Unable to fetch mnemonic from the store')
  }
  const keys = await generateKeys(mnemonic)
  return keys?.privateKey
}

const getSerializedSignature = async (
  message: string,
  accountMTWAddress: string
): Promise<string> => {
  const privateKey = await getPrivateKey(accountMTWAddress)
  const signature = signMessage(message, privateKey, accountMTWAddress)
  return serializeSignature(signature)
}
const getAuthHeader = async (message: string, accountMTWAddress: string): Promise<string> => {
  const serializedSignature = await getSerializedSignature(message, accountMTWAddress)
  return `Valora ${accountMTWAddress}:${serializedSignature}`
}
