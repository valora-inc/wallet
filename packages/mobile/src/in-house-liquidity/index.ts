import networkConfig from 'src/geth/networkConfig'
import { serializeSignature, signMessage } from '@celo/utils/lib/signatureUtils'
import { getStoredMnemonic } from 'src/backup/utils'
import { generateKeys } from '@celo/utils/lib/account'

export const createPersonaAccount = async (accountMTWAddress: string): Promise<Response> => {
  const body = { accountAddress: accountMTWAddress }
  console.log(body)
  return signAndFetch('/persona/account/create', accountMTWAddress, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
}

// Helper Functions

const getKeys = async (accountMTWAddress: string) => {
  const mnemonic = await getStoredMnemonic(accountMTWAddress)

  if (!mnemonic) {
    throw new Error('Unable to fetch mnemonic from the store')
  }
  return generateKeys(mnemonic)
}

const getSerializedSignature = async (
  message: string,
  privateKey: string,
  walletAddress: string
): Promise<string> => {
  const signature = signMessage(message, '0x' + privateKey, walletAddress)
  return serializeSignature(signature)
}

const signAndFetch = async (
  path: string,
  accountMTWAddress: string,
  options: RequestInit
): Promise<Response> => {
  const authAndDateHeaders = await getAuthAndDateHeaders(
    options.method,
    path,
    accountMTWAddress,
    options.body as string
  )
  return fetch(`${networkConfig.inhouseLiquditiyUrl}${path}`, {
    ...options,
    headers: {
      ...options.headers,
      ...authAndDateHeaders,
    },
  })
}

const getAuthAndDateHeaders = async (
  httpVerb: string = '',
  requestPath: string,
  accountMTWAddress: string,
  requestBody: BodyInit | null
): Promise<{ Date: string; Authorization: string }> => {
  const date = new Date().toUTCString()
  const message =
    httpVerb === 'get'
      ? `${httpVerb.toLowerCase()} ${requestPath} ${date}`
      : `${httpVerb.toLowerCase()} ${requestPath} ${date} ${requestBody}`
  const { privateKey, address: walletAddress } = await getKeys(accountMTWAddress)
  const serializedSignature = await getSerializedSignature(message, privateKey, walletAddress)
  const authorization = `Valora ${walletAddress}:${serializedSignature}`
  return {
    Date: date,
    Authorization: authorization,
  }
}
