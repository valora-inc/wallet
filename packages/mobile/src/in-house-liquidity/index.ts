import networkConfig from 'src/geth/networkConfig'
import { getContractKitAsync } from 'src/web3/contracts'
import { signWithDEK } from 'src/web3/dataEncryptionKey'

export const createPersonaAccount = async ({
  accountMTWAddress,
  walletAddress,
}: {
  accountMTWAddress: string
  walletAddress: string
}): Promise<Response> => {
  const body = { accountAddress: accountMTWAddress }
  return signAndFetch({
    path: '/persona/account/create',
    accountMTWAddress,
    walletAddress,
    requestOptions: {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    },
  })
}

const getSerializedSignature = async ({
  message,
  accountMTWAddress,
}: {
  message: string
  accountMTWAddress: string
}): Promise<string> => {
  const contractKit = await getContractKitAsync()
  const accountWrapper = await contractKit.contracts.getAccounts()
  const dataEncryptionKey = await accountWrapper.getDataEncryptionKey(accountMTWAddress)
  return signWithDEK({ message, dataEncryptionKey })
}

interface SignAndFetchParams {
  path: string
  accountMTWAddress: string
  walletAddress: string
  requestOptions: RequestInit
}

/**
 * A fetch wrapper that adds in the signature needed for IHL authorization
 *
 *
 * @param {params.path} string like /persona/get/foo
 * @param {params.accountMTWAddress} accountAddress
 * @param {params.walletAddress} walletAddress
 * @param {params.requestOptions} RequestInit all the normal fetch options
 * @returns {Response} response object from the fetch call
 */
export const signAndFetch = async ({
  path,
  accountMTWAddress,
  walletAddress,
  requestOptions,
}: SignAndFetchParams): Promise<Response> => {
  const date = new Date()
  const authAndDateHeaders = await getAuthAndDateHeaders({
    httpVerb: requestOptions.method,
    requestPath: path,
    date,
    accountMTWAddress,
    walletAddress,
    requestBody: requestOptions.body,
  })
  return fetch(`${networkConfig.inHouseLiquidityURL}${path}`, {
    ...requestOptions,
    headers: {
      ...requestOptions.headers,
      ...authAndDateHeaders,
    },
  })
}

interface GetAuthAndDateHeadersParams {
  httpVerb: string | undefined
  requestPath: string
  date: Date
  accountMTWAddress: string
  walletAddress: string
  requestBody?: BodyInit | null
}
/**
 * Gets the auth and date headers that IHL expects as a signature on most requests
 *
 * The behavior is slightly different between GET requests and other types of requests
 *
 * @param {params.httpVerb} string GET, POST
 * @param {params.requestPath} string like /persona/get/foo
 * @param {params.date} Date date object
 * @param {params.accountMTWAddress} accountAddress
 * @param {params.walletAddress} walletAddress
 * @param {params.requestBody} string optional request body
 * @returns {{Date, Authorization}} date and authorization headers
 */
export const getAuthAndDateHeaders = async ({
  httpVerb = '',
  requestPath,
  date,
  accountMTWAddress,
  walletAddress,
  requestBody,
}: GetAuthAndDateHeadersParams): Promise<{ Date: string; Authorization: string }> => {
  const dateString = date.toUTCString()
  const message =
    httpVerb.toLowerCase() === 'get'
      ? `${httpVerb.toLowerCase()} ${requestPath} ${dateString}`
      : `${httpVerb.toLowerCase()} ${requestPath} ${dateString} ${requestBody}`
  const serializedSignature = await getSerializedSignature({ message, accountMTWAddress })
  const authorization = `Valora ${walletAddress}:${serializedSignature}`
  return {
    Date: dateString,
    Authorization: authorization,
  }
}
