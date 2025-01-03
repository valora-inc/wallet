import { KycSchema, KycStatus as FiatConnectKycStatus } from '@fiatconnect/fiatconnect-types'
import { KycStatus as PersonaKycStatus } from 'src/account/reducer'
import { FiatConnectProviderInfo } from 'src/fiatconnect'
import { getFiatConnectClient } from 'src/fiatconnect/clients'
import { getClient } from 'src/in-house-liquidity/client'
import networkConfig from 'src/web3/networkConfig'

export interface GetKycStatusResponse {
  providerId: string
  kycStatus: Record<KycSchema, FiatConnectKycStatus>
  persona: PersonaKycStatus
}

export const AUTH_COOKIE = 'FIATCONNECT-PROVIDER-COOKIE'

/**
 * Checks that a the wallet address is defined.
 *
 * If the provided wallet address is not defined, throws, else return the address.
 *
 * @param {string | null} params.walletAddress - Wallet address to check.
 * @returns {{walletAddress: string}} The wallet address.
 */
export function verifyWalletAddress({ walletAddress }: { walletAddress: string | null }): {
  walletAddress: string
} {
  if (!walletAddress) {
    throw new Error('Cannot call IHL because walletAddress is null')
  }

  return {
    walletAddress,
  }
}

/**
 * Makes a request to in-house-liquidity.
 *
 * If `params.providerInfo` is included, authentication cookies will be extracted from the appropriate FiatConnect
 * client and included in the headers of the request to in-house-liquidity.
 *
 * @param {FiatConnectProviderInfo} params.providerInfo - Optional information about a FiatConnect provider.
 * @param {string} params.path - Path to append to in-house-liquidity origin.
 * @param {Record<string, any>} params.options - Options object to include in request. Headers and content-type cannot be overridden.
 * @returns {Promise<Response>} Response object.
 */
export async function makeRequest({
  providerInfo,
  path,
  options,
}: {
  providerInfo?: FiatConnectProviderInfo
  path: string
  options: RequestInit
}): Promise<Response> {
  const ihlClient = await getClient()
  const authHeaders = providerInfo ? await exports.getAuthHeaders({ providerInfo }) : {}
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
    },
  }

  return await ihlClient.fetch(`${networkConfig.inHouseLiquidityURL}${path}`, {
    ...options,
    ...defaultOptions,
  })
}

/**
 * Extracts Fiatconnect provider-specific SIWE cookies from the relevant client and parses them into
 * a headers object appropriate for sending to in-house-liquidity.
 *
 * If the user is not currently logged in with the selected provider, a login will be attempted in order
 * (re)fresh the SIWE session.
 *
 * @param {FiatConnectProviderInfo} params.providerInfo - Information about a FiatConnect provider.
 * @returns {Promise<Record<string, string>>} An object containing the header to pass to in-house-liquidity.
 */
export async function getAuthHeaders({
  providerInfo,
}: {
  providerInfo: FiatConnectProviderInfo
}): Promise<Record<string, string>> {
  const fiatConnectClient = await getFiatConnectClient(
    providerInfo.id,
    providerInfo.baseUrl,
    providerInfo.apiKey
  )
  if (!fiatConnectClient.isLoggedIn()) {
    await fiatConnectClient.login()
  }
  return {
    [AUTH_COOKIE]: JSON.stringify(fiatConnectClient.getCookies()),
  }
}

/**
 * Calls GET /fiatconnect/kyc/:providerId on in-house-liquidity.
 *
 * Returns the user's status for any number of KYC schema requests for a single FiatConnect provider,
 * as well as the user's Persona KYC status. If response is non-OK, throws.
 *
 * @param {FiatConnectProviderInfo} params.providerInfo - Information about the FiatConnect provider to get KYC statuses for.
 * @param {KycSchema[]} params.kycSchemas - A list of `KycSchema`s to get statuses for.
 * @returns {Promise<GetKycStatusResponse>} The typed response body from in-house-liquidity.
 */
export async function getKycStatus({
  providerInfo,
  kycSchemas,
}: {
  providerInfo: FiatConnectProviderInfo
  kycSchemas: KycSchema[]
}): Promise<GetKycStatusResponse> {
  const response = await exports.makeRequest({
    providerInfo,
    path:
      `/fiatconnect/kyc/${providerInfo.id}?` +
      new URLSearchParams({
        kycSchemas: kycSchemas.toString(),
      }),
    options: { method: 'GET' },
  })

  if (!response.ok) {
    throw new Error(`Got non-ok response from IHL while fetching KYC: ${response.status}`)
  }

  return (await response.json()) as GetKycStatusResponse
}

/**
 * Calls POST /fiatconnect/kyc/:providerId/:kycSchema on in-house-liquidity.
 *
 * Once a user has submitted KYC information to Persona, calling this method will prompt
 * in-house-liquidity to submit the selected KYC schema to the selected provider using that information.
 *
 * Silently returns on success. If response is non-OK, throws.
 *
 * @param {FiatConnectProviderInfo} params.providerInfo - Information about the FiatConnect provider to submit KYC to.
 * @param {KycSchema} params.kycSchema - The `KycSchema` to submit to the selected provider.
 * @returns {Promise<void>}
 */
export async function postKyc({
  providerInfo,
  kycSchema,
}: {
  providerInfo: FiatConnectProviderInfo
  kycSchema: KycSchema
}): Promise<void> {
  const response = await exports.makeRequest({
    providerInfo,
    path: `/fiatconnect/kyc/${providerInfo.id}/${kycSchema}`,
    options: { method: 'POST' },
  })

  if (!response.ok) {
    throw new Error(`Got non-ok response from IHL while posting KYC: ${response.status}`)
  }
}

/**
 * Calls DELETE /fiatconnect/kyc/:providerId/:kycSchema on in-house-liquidity.
 *
 * This deletes any stored KYC information and allows the user to retry KYC
 *
 * @param {FiatConnectProviderInfo} params.providerInfo - Information about the FiatConnect provider to submit KYC to.
 * @param {KycSchema} params.kycSchema - The `KycSchema` to submit to the selected provider.
 * @returns {Promise<void>}
 */
export async function deleteKyc({
  providerInfo,
  kycSchema,
}: {
  providerInfo: FiatConnectProviderInfo
  kycSchema: KycSchema
}): Promise<void> {
  const response = await exports.makeRequest({
    providerInfo,
    path: `/fiatconnect/kyc/${providerInfo.id}/${kycSchema}`,
    options: { method: 'DELETE' },
  })

  if (!response.ok && response.status !== 404) {
    // 404 means the resource is already deleted or the providerId is invalid
    throw new Error(`Got non-ok/404 response from IHL while deleting KYC: ${response.status}`)
  }
}

/**
 * Calls POST /persona/account/create on in-house-liquidity.
 *
 * Creates a Persona account for the given wallet address.
 *
 * Silently returns on success, or if a Persona account already exists for the given address.
 * Otherwise, throws.
 *
 * @param {params.walletAddress} string - The wallet address to create a Persona account for.
 * @returns {Promise<void>}
 */
export async function createPersonaAccount({
  walletAddress,
}: {
  walletAddress: string
}): Promise<void> {
  const response = await exports.makeRequest({
    path: `/persona/account/create`,
    options: {
      method: 'POST',
      body: JSON.stringify({ accountAddress: walletAddress }),
    },
  })

  if (!response.ok && response.status !== 409) {
    throw new Error(
      `Got non-ok/409 response from IHL while creating Persona account: ${response.status}`
    )
  }
}
