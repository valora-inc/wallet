import networkConfig from 'src/geth/networkConfig'
import { serializeSignature, signMessage } from '@celo/utils/lib/signatureUtils'
import { getStoredMnemonic } from 'src/backup/utils'
import { generateKeys } from '@celo/utils/lib/account'

export const createPersonaAccount = async (accountMTWAddress: string): Promise<Response> => {
  const body = { accountAddress: accountMTWAddress }
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

/**
 * A fetch wrapper that adds in the signature needed for IHL authorization
 *
 *
 * @param {path} string like /persona/get/foo
 * @param {accountMTWAddress} accountAddress
 * @param {options} RequestInit all the normal fetch options
 * @returns {Response} response object from the fetch call
 */
export const signAndFetch = async (
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
/**
 * Gets the auth and date headers that IHL expects as a signature on mosts requests
 *
 * The behavior is slightly different between GET requests and other types of requests
 *
 * @param {httpVerb} string GET, POST
 * @param {requestPath} string like /persona/get/foo
 * @param {accountMTWAddress} accountAddress
 * @param {requestBody} string optional request body
 * @returns {{Date, Authorization}} date and authorization headers
 */
export const getAuthAndDateHeaders = async (
  httpVerb: string = '',
  requestPath: string,
  accountMTWAddress: string,
  requestBody?: BodyInit | null
): Promise<{ Date: string; Authorization: string }> => {
  const date = new Date().toUTCString()
  const message =
    httpVerb.toLowerCase() === 'get'
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
