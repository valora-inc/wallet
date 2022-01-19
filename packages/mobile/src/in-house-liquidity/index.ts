import networkConfig from 'src/geth/networkConfig'
import jwt from 'jsonwebtoken'
import KeyEncoder from 'key-encoder'
import { compressedPubKey } from '@celo/utils/lib/dataEncryptionKey'
import { hexToBuffer, trimLeading0x } from '@celo/utils/lib/address'

interface CreateFinclusiveBankAccountParams {
  accountMTWAddress: string
  dekPrivate: string
  plaidAccessToken: string
}

/**
 * Create a fiat bank account with finclusive
 *
 *
 * @param {params.accountMTWAddress} accountAddress
 * @param {params.dekPrivate} dekPrivate private data encryption key
 * @param {params.plaidAccessToken} plaidAccessToken plaid long term access token
 * @returns {Response} response object from the fetch call
 */
export const createFinclusiveBankAccount = async ({
  accountMTWAddress,
  dekPrivate,
  plaidAccessToken,
}: CreateFinclusiveBankAccountParams) => {
  const body = {
    accountAddress: accountMTWAddress,
    plaidAccessToken,
  }
  return signAndFetch({
    path: '/account/bank-account',
    accountMTWAddress,
    dekPrivate,
    requestOptions: {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    },
  })
}

interface ExchangePlaidAccessTokenParams {
  accountMTWAddress: string
  dekPrivate: string
  publicToken: string
}

/**
 * Exchange a plaid plublic token for a long-term plaid access token
 *
 *
 * @param {params.accountMTWAddress} accountAddress
 * @param {params.dekPrivate} dekPrivate private data encryption key
 * @param {params.publicToken} publicToken plaid public token
 * @returns {Response} response object from the fetch call
 */
export const exchangePlaidAccessToken = async ({
  accountMTWAddress,
  dekPrivate,
  publicToken,
}: ExchangePlaidAccessTokenParams) => {
  const body = {
    publicToken,
  }
  return signAndFetch({
    path: '/plaid/access-token/exchange',
    accountMTWAddress,
    dekPrivate,
    requestOptions: {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    },
  })
}

interface CreateLinkTokenParams {
  accountMTWAddress: string
  dekPrivate: string
  isAndroid: boolean
  language: string
  accessToken?: string
  phoneNumber: string
}

const keyEncoder = new KeyEncoder('secp256k1')

/**
 * Create a new Plaid Link Token by calling IHL
 *
 *
 * @param {params.accountMTWAddress} accountAddress
 * @param {params.dekPrivate} dekPrivate private data encryption key
 * @param {params.isAndroid} isAndroid
 * @param {params.language} language the users current language
 * @param {params.accessToken} accessToken optional access token used for editing existing items
 * @param {params.phoneNumber} phoneNumber users verified phone number
 * @returns {Response} response object from the fetch call
 */
export const createLinkToken = async ({
  accountMTWAddress,
  dekPrivate,
  isAndroid,
  language,
  accessToken,
  phoneNumber,
}: CreateLinkTokenParams): Promise<Response> => {
  const body = {
    accountAddress: accountMTWAddress,
    isAndroid,
    language,
    accessToken,
    phoneNumber,
  }
  return signAndFetch({
    path: '/plaid/link-token/create',
    accountMTWAddress,
    dekPrivate,
    requestOptions: {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    },
  })
}

export const createPersonaAccount = async ({
  accountMTWAddress,
  dekPrivate,
}: {
  accountMTWAddress: string
  dekPrivate: string
}): Promise<Response> => {
  const body = { accountAddress: accountMTWAddress }
  return signAndFetch({
    path: '/persona/account/create',
    accountMTWAddress,
    dekPrivate,
    requestOptions: {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    },
  })
}

interface SignAndFetchParams {
  path: string
  accountMTWAddress: string
  dekPrivate: string
  requestOptions: RequestInit
}

/**
 * A fetch wrapper that adds in the signature needed for IHL authorization
 *
 *
 * @param {params.path} string like /persona/get/foo
 * @param {params.accountMTWAddress} accountMTWAddress
 * @param {params.requestOptions} requestOptions all the normal fetch options
 * @returns {Response} response object from the fetch call
 */
export const signAndFetch = async ({
  path,
  accountMTWAddress,
  dekPrivate,
  requestOptions,
}: SignAndFetchParams): Promise<Response> => {
  const authHeader = await getAuthHeader({ accountMTWAddress, dekPrivate })
  return fetch(`${networkConfig.inHouseLiquidityURL}${path}`, {
    ...requestOptions,
    headers: {
      ...requestOptions.headers,
      Authorization: authHeader,
    },
  })
}

/**
 * Gets the auth header that IHL expects as a signature on most requests
 *
 * @param {params.accountMTWAddress} accountMTWAddress
 * @param {params.dekPrivate} dekPrivate : private data encryption key
 * @returns authorization header
 */
export const getAuthHeader = async ({
  accountMTWAddress,
  dekPrivate,
}: {
  accountMTWAddress: string
  dekPrivate: string
}): Promise<string> => {
  const dekPrivatePem = keyEncoder.encodePrivate(trimLeading0x(dekPrivate), 'raw', 'pem')
  const dekPublicHex = compressedPubKey(hexToBuffer(dekPrivate))
  const dekPublicPem = keyEncoder.encodePublic(trimLeading0x(dekPublicHex), 'raw', 'pem')
  const token = jwt.sign({ iss: dekPublicPem, sub: accountMTWAddress }, dekPrivatePem, {
    algorithm: 'ES256',
    expiresIn: '5m',
  })

  return `Bearer ${token}`
}
