import networkConfig from 'src/geth/networkConfig'
import { getContractKitAsync } from 'src/web3/contracts'
import {
  signWithDEK,
  EncryptionKeySigner,
  AuthenticationMethod,
} from '@celo/identity/lib/odis/query'
export const createPersonaAccount = async (
  accountMTWAddress: string,
  walletAddress: string
): Promise<Response> => {
  const body = { accountAddress: accountMTWAddress }
  return signAndFetch('/persona/account/create', accountMTWAddress, walletAddress, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
}

const getSerializedSignature = async (
  message: string,
  accountMTWAddress: string
): Promise<string> => {
  const contractKit = await getContractKitAsync()
  const accountWrapper = await contractKit.contracts.getAccounts()
  const dataEncryptionKey = await accountWrapper.getDataEncryptionKey(accountMTWAddress)
  const signer: EncryptionKeySigner = {
    authenticationMethod: AuthenticationMethod.ENCRYPTION_KEY,
    rawKey: dataEncryptionKey,
  }
  return signWithDEK(message, signer)
}

/**
 * A fetch wrapper that adds in the signature needed for IHL authorization
 *
 *
 * @param {path} string like /persona/get/foo
 * @param {accountMTWAddress} accountAddress
 * @param {walletAddress} walletAddress
 * @param {options} RequestInit all the normal fetch options
 * @returns {Response} response object from the fetch call
 */
export const signAndFetch = async (
  path: string,
  accountMTWAddress: string,
  walletAddress: string,
  options: RequestInit
): Promise<Response> => {
  const authAndDateHeaders = await getAuthAndDateHeaders(
    options.method,
    path,
    accountMTWAddress,
    walletAddress,
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
 * @param {walletAddress} walletAddress
 * @param {requestBody} string optional request body
 * @returns {{Date, Authorization}} date and authorization headers
 */
export const getAuthAndDateHeaders = async (
  httpVerb: string = '',
  requestPath: string,
  accountMTWAddress: string,
  walletAddress: string,
  requestBody?: BodyInit | null
): Promise<{ Date: string; Authorization: string }> => {
  const date = new Date().toUTCString()
  const message =
    httpVerb.toLowerCase() === 'get'
      ? `${httpVerb.toLowerCase()} ${requestPath} ${date}`
      : `${httpVerb.toLowerCase()} ${requestPath} ${date} ${requestBody}`
  const serializedSignature = await getSerializedSignature(message, accountMTWAddress)
  const authorization = `Valora ${walletAddress}:${serializedSignature}`
  return {
    Date: date,
    Authorization: authorization,
  }
}
