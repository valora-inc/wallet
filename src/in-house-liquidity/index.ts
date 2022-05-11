import { FinclusiveKycStatus } from 'src/account/reducer'
import networkConfig from 'src/geth/networkConfig'

interface RequiredParams {
  walletAddress: string
}

/**
 * get the status of a users finclusive compliance check aka their KYC status
 *
 *
 * @param {params.walletAddress} walletAddress
 * @param {params.dekPrivate} dekPrivate private data encryption key
 * @returns {FinclusiveKycStatus} the users current status
 */
export const getFinclusiveComplianceStatus = async ({
  walletAddress,
}: RequiredParams): Promise<FinclusiveKycStatus> => {
  const response = await signAndFetch({
    path: `/account/${encodeURIComponent(walletAddress)}/compliance-check-status`,
    walletAddress,
    requestOptions: {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    },
  })
  if (!response.ok) {
    throw new Error(
      `IHL GET /account/:accountAddress/compliance-check-status failure status ${response.status}`
    )
  }
  const { complianceCheckStatus } = await response.json()
  return complianceCheckStatus
}

type DeleteFinclusiveBankAccountParams = RequiredParams & {
  id: number
}

/**
 * get a fiat bank account from finclusive
 *
 * @param {params.walletAddress} walletAddress
 * @param {params.dekPrivate} dekPrivate private data encryption key
 */
export const deleteFinclusiveBankAccount = async ({
  walletAddress,
  id,
}: DeleteFinclusiveBankAccountParams): Promise<void> => {
  const body = {
    accountAddress: walletAddress,
    accountId: id,
  }
  const response = await signAndFetch({
    path: `/account/bank-account?accountAddress=${encodeURIComponent(walletAddress)}`,
    walletAddress,
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
  institutionName: string
  institutionLogo?: string
}

/**
 * get a users fiat bank accounts from finclusive
 *
 *
 * @param {params.walletAddress} walletAddress
 * @param {params.dekPrivate} dekPrivate private data encryption key
 * @returns {BankAccounts} List of bank accounts that the user has linked
 */
export const getFinclusiveBankAccounts = async ({
  walletAddress,
}: RequiredParams): Promise<BankAccount[]> => {
  const response = await signAndFetch({
    path: `/account/bank-account?accountAddress=${encodeURIComponent(walletAddress)}`,
    walletAddress,
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
 * @param {params.walletAddress} walletAddress
 * @param {params.plaidAccessToken} plaidAccessToken plaid long term access token
 */
export const createFinclusiveBankAccount = async ({
  walletAddress,
  plaidAccessToken,
}: CreateFinclusiveBankAccountParams): Promise<void> => {
  const body = {
    accountAddress: walletAddress,
    plaidAccessToken,
  }
  const response = await signAndFetch({
    path: '/account/bank-account',
    walletAddress,
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
 * @param {params.walletAddress} walletAddress
 * @param {params.publicToken} publicToken plaid public token
 * @returns {accessToken} string accesstoken from plaid
 */
export const exchangePlaidAccessToken = async ({
  walletAddress,
  publicToken,
}: ExchangePlaidAccessTokenParams): Promise<string> => {
  const body = {
    publicToken,
    accountAddress: walletAddress,
  }
  const response = await signAndFetch({
    path: '/plaid/access-token/exchange',
    walletAddress,

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
 * @param {params.walletAddress} walletAddress
 * @param {params.isAndroid} isAndroid
 * @param {params.language} language the users current language
 * @param {params.accessToken} accessToken optional access token used for editing existing items
 * @param {params.phoneNumber} phoneNumber users verified phone number
 * @returns {linkToken} the link token from the plaid backend
 */
export const createLinkToken = async ({
  walletAddress,

  isAndroid,
  language,
  accessToken,
  phoneNumber,
}: CreateLinkTokenParams): Promise<string> => {
  const body = {
    accountAddress: walletAddress,
    isAndroid,
    language,
    accessToken,
    phoneNumber,
  }
  const response = await signAndFetch({
    path: '/plaid/link-token/create',
    walletAddress,

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
 * @param {params.walletAddress} walletAddress
 */
export const createPersonaAccount = async ({ walletAddress }: RequiredParams): Promise<void> => {
  const body = { accountAddress: walletAddress }
  const response = await signAndFetch({
    path: '/persona/account/create',
    walletAddress,
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
  walletAddress: string
  requestOptions: RequestInit
}

/**
 * A fetch wrapper that adds in the signature needed for IHL authorization
 *
 *
 * @param {params.path} string like /persona/get/foo
 * @param {params.requestOptions} requestOptions all the normal fetch options
 * @returns {Response} response object from the fetch call
 */
export const signAndFetch = async ({
  path,
  requestOptions,
}: SignAndFetchParams): Promise<Response> => {
  return fetch(`${networkConfig.inHouseLiquidityURL}${path}`, {
    ...requestOptions,
    headers: {
      ...requestOptions.headers,
      // Authorization: authHeader, // todo add this once auth scheme is refactored
    },
  })
}

// just checks that the wallet address is non null for now. keeping this since we may want it to do more once
//  the new auth scheme is figured out (like checking if a wallet is unlocked or a token is truthy)
export const verifyWalletAddress = ({
  walletAddress,
}: {
  walletAddress: string | null
}): RequiredParams => {
  if (!walletAddress) {
    throw new Error('Cannot call IHL because walletAddress is null')
  }

  return {
    walletAddress: walletAddress,
  }
}
