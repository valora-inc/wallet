import networkConfig from 'src/geth/networkConfig'
import jwt from 'jsonwebtoken'
import KeyEncoder from 'key-encoder'
import { compressedPubKey } from '@celo/utils/lib/dataEncryptionKey'
import { hexToBuffer, trimLeading0x } from '@celo/utils/lib/address'

const keyEncoder = new KeyEncoder('secp256k1')
interface RequiredParams {
  accountMTWAddress: string
  dekPrivate: string
}

type DeleteFinclusiveBankAccountParams = RequiredParams & {
  id: number
}

/**
 * get a fiat bank account from finclusive
 *
 * @param {params.accountMTWAddress} accountAddress
 * @param {params.dekPrivate} dekPrivate private data encryption key
 */
export const deleteFinclusiveBankAccount = async ({
  accountMTWAddress,
  dekPrivate,
  id,
}: DeleteFinclusiveBankAccountParams): Promise<void> => {
  const body = {
    accountAddress: accountMTWAddress,
    accountId: id,
  }
  const response = await signAndFetch({
    path: `/account/bank-account?accountAddress=${encodeURIComponent(accountMTWAddress)}`,
    accountMTWAddress,
    dekPrivate,
    requestOptions: {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    },
  })
  if (!response.ok) {
    throw new Error(`IHL DELETE /account/bank-account failure status ${response.status}`)
  }
}

export interface BankAccount {
  id: number
  accountName: string
  accountType: string
  accountNumberTruncated: string
}

/**
 * get a users fiat bank accounts from finclusive
 *
 *
 * @param {params.accountMTWAddress} accountAddress
 * @param {params.dekPrivate} dekPrivate private data encryption key
 * @returns {BankAccounts} List of bank accounts that the user has linked
 */
export const getFinclusiveBankAccounts = async ({
  accountMTWAddress,
  dekPrivate,
}: RequiredParams): Promise<BankAccount[]> => {
  const response = await signAndFetch({
    path: `/account/bank-account?accountAddress=${encodeURIComponent(accountMTWAddress)}`,
    accountMTWAddress,
    dekPrivate,
    requestOptions: {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    },
  })
  if (!response.ok) {
    throw new Error(`IHL GET /account/bank-account failure status ${response.status}`)
  }
  const { bankAccounts } = await response.json()
  return bankAccounts
}

type CreateFinclusiveBankAccountParams = RequiredParams & {
  plaidAccessToken: string
}

/**
 * Create a fiat bank account with finclusive
 *
 *
 * @param {params.accountMTWAddress} accountAddress
 * @param {params.dekPrivate} dekPrivate private data encryption key
 * @param {params.plaidAccessToken} plaidAccessToken plaid long term access token
 */
export const createFinclusiveBankAccount = async ({
  accountMTWAddress,
  dekPrivate,
  plaidAccessToken,
}: CreateFinclusiveBankAccountParams): Promise<void> => {
  const body = {
    accountAddress: accountMTWAddress,
    plaidAccessToken,
  }
  const response = await signAndFetch({
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
  if (!response.ok) {
    throw new Error(`IHL POST /account/bank-account failure status ${response.status}`)
  }
}

type ExchangePlaidAccessTokenParams = RequiredParams & {
  publicToken: string
}

/**
 * Exchange a plaid plublic token for a long-term plaid access token
 *
 *
 * @param {params.accountMTWAddress} accountAddress
 * @param {params.dekPrivate} dekPrivate private data encryption key
 * @param {params.publicToken} publicToken plaid public token
 * @returns {accessToken} string accesstoken from plaid
 */
export const exchangePlaidAccessToken = async ({
  accountMTWAddress,
  dekPrivate,
  publicToken,
}: ExchangePlaidAccessTokenParams): Promise<string> => {
  const body = {
    publicToken,
    accountAddress: accountMTWAddress,
  }
  const response = await signAndFetch({
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
  if (!response.ok) {
    throw new Error(`IHL /plaid/access-token/exchange failure status ${response.status}`)
  }
  const { accessToken } = await response.json()
  return accessToken
}

type CreateLinkTokenParams = RequiredParams & {
  isAndroid: boolean
  language: string
  accessToken?: string
  phoneNumber: string
}

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
 * @returns {linkToken} the link token from the plaid backend
 */
export const createLinkToken = async ({
  accountMTWAddress,
  dekPrivate,
  isAndroid,
  language,
  accessToken,
  phoneNumber,
}: CreateLinkTokenParams): Promise<string> => {
  const body = {
    accountAddress: accountMTWAddress,
    isAndroid,
    language,
    accessToken,
    phoneNumber,
  }
  const response = await signAndFetch({
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
  if (!response.ok) {
    throw new Error(`IHL /plaid/link-token/create failure status ${response.status}`)
  }
  const { linkToken } = await response.json()
  return linkToken
}

/**
 * Create a Persona account for the given accountMTWAddress
 *
 *
 * @param {params.accountMTWAddress} accountAddress
 * @param {params.dekPrivate} dekPrivate private data encryption key
 */
export const createPersonaAccount = async ({
  accountMTWAddress,
  dekPrivate,
}: RequiredParams): Promise<void> => {
  const body = { accountAddress: accountMTWAddress }
  const response = await signAndFetch({
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
  if (response.status !== 201 && response.status !== 409) {
    throw new Error(`IHL /persona/account/create failure status ${response.status}`)
  }
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
}: RequiredParams): Promise<string> => {
  const dekPrivatePem = keyEncoder.encodePrivate(trimLeading0x(dekPrivate), 'raw', 'pem')
  const dekPublicHex = compressedPubKey(hexToBuffer(dekPrivate))
  const dekPublicPem = keyEncoder.encodePublic(trimLeading0x(dekPublicHex), 'raw', 'pem')
  const token = jwt.sign({ iss: dekPublicPem, sub: accountMTWAddress }, dekPrivatePem, {
    algorithm: 'ES256',
    expiresIn: '5m',
  })

  return `Bearer ${token}`
}

export const verifyDekAndMTW = ({
  dekPrivate,
  accountMTWAddress,
}: {
  dekPrivate: string | null
  accountMTWAddress: string | null
}): RequiredParams => {
  if (!accountMTWAddress) {
    throw new Error('Cannot call IHL because accountMTWAddress is null')
  }

  if (!dekPrivate) {
    throw new Error('Cannot call IHL because dekPrivate is null')
  }
  return {
    dekPrivate,
    accountMTWAddress,
  }
}
