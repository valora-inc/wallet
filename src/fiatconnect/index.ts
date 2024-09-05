import { CreateQuoteParams } from '@fiatconnect/fiatconnect-sdk'
import { FiatType, QuoteErrorResponse, QuoteResponse } from '@fiatconnect/fiatconnect-types'
import { CICOFlow, isUserInputCrypto } from 'src/fiatExchanges/utils'
import { WALLET_CRYPTO_TO_FIATCONNECT_CRYPTO } from 'src/fiatconnect/consts'
import { LocalCurrencyCode } from 'src/localCurrency/consts'
import { getDynamicConfigParams } from 'src/statsig'
import { DynamicConfigs } from 'src/statsig/constants'
import { StatsigDynamicConfigs } from 'src/statsig/types'
import Logger from 'src/utils/Logger'
import { fetchWithTimeout } from 'src/utils/fetchWithTimeout'
import networkConfig from 'src/web3/networkConfig'

const TAG = 'FIATCONNECT'

export interface FiatConnectProviderInfo {
  id: string
  providerName: string
  imageUrl: string
  baseUrl: string
  websiteUrl: string
  termsAndConditionsUrl: string
  privacyPolicyUrl: string
  iconUrl: string
  isNew: {
    in: boolean
    out: boolean
  }
  apiKey?: string
}

// A bit hacky. This function returns the currency code if localCurrency is in
// FiatType and otherwise returns undefined
// This assumes that the enum values match which is a fairly safe assumption since they both use ISO 4217
export function convertToFiatConnectFiatCurrency(
  localCurrency: LocalCurrencyCode
): FiatType | undefined {
  return FiatType[localCurrency as unknown as FiatType]
}

/**
 * Get a list of FiatConnect providers.
 *
 * Queries a cloud function for static information about FiatConnect providers.
 */
export async function getFiatConnectProviders(
  address: string,
  providerList?: string
): Promise<FiatConnectProviderInfo[]> {
  const response = await fetchWithTimeout(
    `${networkConfig.getFiatConnectProvidersUrl}?` +
      new URLSearchParams({
        address,
        ...(!!providerList && { providers: providerList }),
      }),
    undefined,
    getDynamicConfigParams(DynamicConfigs[StatsigDynamicConfigs.WALLET_NETWORK_TIMEOUT_SECONDS])
      .cico * 1000
  )
  if (!response.ok) {
    Logger.error(TAG, `Failure response fetching FiatConnect providers: ${response}`)
    throw new Error(
      `Failure response fetching FiatConnect providers. ${response.status}  ${response.statusText}`
    )
  }
  const { providers } = await response.json()
  return providers
}

export type QuotesInput = {
  fiatConnectProviders: FiatConnectProviderInfo[]
  flow: CICOFlow
  localCurrency: LocalCurrencyCode
  digitalAsset: string
  cryptoAmount: number
  fiatAmount: number
  country: string
  address: string
}

export type GetFiatConnectQuotesResponse = {
  id: string
  ok: boolean
  val: QuoteResponse | QuoteErrorResponse | { error: string }
}

export type FiatConnectQuoteError = {
  provider: FiatConnectProviderInfo
  ok: boolean
} & (QuoteErrorResponse | { error: string })

export type FiatConnectQuoteSuccess = {
  provider: FiatConnectProviderInfo
  ok: boolean
} & QuoteResponse

export async function getFiatConnectQuotes(
  params: QuotesInput
): Promise<(FiatConnectQuoteSuccess | FiatConnectQuoteError)[]> {
  const {
    fiatConnectProviders,
    localCurrency,
    digitalAsset,
    cryptoAmount,
    fiatAmount,
    country,
    flow,
    address,
  } = params
  const fiatType = convertToFiatConnectFiatCurrency(localCurrency)
  if (!fiatType) return []
  const cryptoType = WALLET_CRYPTO_TO_FIATCONNECT_CRYPTO[digitalAsset]
  if (!cryptoType) return []
  const quoteParams: CreateQuoteParams = {
    fiatType,
    cryptoType,
    ...(isUserInputCrypto(flow)
      ? { cryptoAmount: cryptoAmount.toString() }
      : { fiatAmount: fiatAmount.toString() }),
    country,
    address,
  }
  const providers = fiatConnectProviders.map((provider) => provider.id).join(',')
  const queryParams = new URLSearchParams({
    ...(quoteParams as Record<string, string>),
    providers,
    quoteType: flow === CICOFlow.CashIn ? 'in' : 'out',
  }).toString()
  const response = await fetchWithTimeout(
    `${networkConfig.getFiatConnectQuotesUrl}?${queryParams}`,
    undefined,
    getDynamicConfigParams(DynamicConfigs[StatsigDynamicConfigs.WALLET_NETWORK_TIMEOUT_SECONDS])
      .cico * 1000
  )
  if (!response.ok) {
    const err = await response.json()
    Logger.error(TAG, `Failure response fetching FiatConnect quotes: ${err} , returning empty list`)
    return []
  }
  const results: { quotes: GetFiatConnectQuotesResponse[] } = await response.json()
  return results.quotes.map((result) => ({
    ...result.val,
    ok: result.ok,
    provider: fiatConnectProviders.find((provider) => provider.id === result.id)!,
  }))
}
export type FetchQuotesInput = QuotesInput & {
  fiatConnectCashInEnabled: boolean
  fiatConnectCashOutEnabled: boolean
}

export async function fetchQuotes(params: FetchQuotesInput) {
  const { fiatConnectCashInEnabled, fiatConnectCashOutEnabled, ...quotesInput } = params
  if (!fiatConnectCashInEnabled && params.flow === CICOFlow.CashIn) return []
  if (!fiatConnectCashOutEnabled && params.flow === CICOFlow.CashOut) return []
  return getFiatConnectQuotes(quotesInput)
}

/**
 * Get an obfuscated version of a fiat account number.
 *
 * For most accounts this will be ... followed by the last 4 digits.
 *
 * Ensures at least 3 digits are blanked out for user privacy since it is expected that this will be used to
 *  compute an accountName for the fiat account, which is returned in GET /accounts and thus shouldn't just
 *  be the user's bank account number. GET /accounts is still authenticated via SIWE, so at least 3 blanked digits
 *  should be acceptable; the obfuscation is just a secondary layer of security around sensitive info.
 *
 * @param accountNumber
 */
export function getObfuscatedAccountNumber(accountNumber: string): string {
  const digitsToReveal = Math.max(0, Math.min(accountNumber.length - 3, 4))
  return digitsToReveal > 0 ? '...' + accountNumber.slice(-digitsToReveal) : ''
}

export function getObfuscatedEmail(email: string): string {
  const [username, domain] = email.split('@')
  const charactersToReveal = Math.min(username.length - 1, 3)
  return `${username.slice(0, charactersToReveal)}***@${domain}`
}
