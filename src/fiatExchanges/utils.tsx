import firebase from '@react-native-firebase/app'
import BigNumber from 'bignumber.js'
import { default as DeviceInfo } from 'react-native-device-info'
import { FIREBASE_ENABLED } from 'src/config'
import { ExternalExchangeProvider } from 'src/fiatExchanges/ExternalExchanges'
import NormalizedQuote from 'src/fiatExchanges/quotes/NormalizedQuote'
import {
  CICOFlow,
  GetCicoQuotesRequest,
  GetCicoQuotesResponse,
  PaymentMethod,
  ProviderSelectionAnalyticsData,
  SimplexQuote,
} from 'src/fiatExchanges/types'
import { getDynamicConfigParams } from 'src/statsig'
import { DynamicConfigs } from 'src/statsig/constants'
import { StatsigDynamicConfigs } from 'src/statsig/types'
import { TokenBalance } from 'src/tokens/slice'
import Logger from 'src/utils/Logger'
import { fetchWithTimeout } from 'src/utils/fetchWithTimeout'
import networkConfig from 'src/web3/networkConfig'

const TAG = 'fiatExchanges:utils'

export interface LegacyMobileMoneyProvider {
  name: string
  celo: {
    cashIn: boolean
    cashOut: boolean
    countries: string[]
    url: string
  }
  cusd: {
    cashIn: boolean
    cashOut: boolean
    countries: string[]
    url: string
  }
}

interface SimplexPaymentData {
  orderId: string
  paymentId: string
  checkoutHtml: string
}

const composePostObject = (body: any) => ({
  method: 'POST',
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(body),
})

export const fetchSimplexPaymentData = async (
  userAddress: string,
  phoneNumber: string | null,
  phoneNumberVerified: boolean,
  simplexQuote: SimplexQuote,
  currentIpAddress: string
) => {
  try {
    const response = await fetchWithTimeout(
      networkConfig.simplexApiUrl,
      composePostObject({
        type: 'payment',
        userAddress,
        phoneNumber,
        phoneNumberVerified,
        simplexQuote,
        currentIpAddress,
        deviceInfo: {
          id: DeviceInfo.getUniqueId(),
          appVersion: DeviceInfo.getVersion(),
          userAgent: DeviceInfo.getUserAgentSync(),
        },
      }),
      getDynamicConfigParams(DynamicConfigs[StatsigDynamicConfigs.WALLET_NETWORK_TIMEOUT_SECONDS])
        .cico * 1000
    )

    if (!response.ok) {
      throw Error(`Fetch failed with status ${response?.status}`)
    }

    const simplexPaymentDataResponse = await response.json()
    if (simplexPaymentDataResponse?.error) {
      throw Error(simplexPaymentDataResponse.error)
    }

    const simplexPaymentData: SimplexPaymentData = simplexPaymentDataResponse
    return simplexPaymentData
  } catch (error) {
    Logger.error(`${TAG}:fetchSimplexPaymentData`, 'Failed to fetch simplex payment data', error)
    throw error
  }
}

const typeCheckNestedProperties = (obj: any, property: string) =>
  obj[property] &&
  typeof obj[property].cashIn === 'boolean' &&
  typeof obj[property].cashOut === 'boolean' &&
  typeof obj[property].url === 'string' &&
  obj[property].countries instanceof Array &&
  obj[property].countries.every(
    (country: any) => typeof country === 'string' && country.length === 2
  )

const isLegacyMobileMoneyProvider = (obj: any): obj is LegacyMobileMoneyProvider => {
  return (
    typeof obj.name === 'string' &&
    typeCheckNestedProperties(obj, 'celo') &&
    typeCheckNestedProperties(obj, 'cusd')
  )
}

export const fetchLegacyMobileMoneyProviders = async () => {
  if (!FIREBASE_ENABLED) return []
  const firebaseLocalProviders: any[] = await firebase
    .database()
    .ref('localCicoProviders')
    .once('value')
    .then((snapshot) => snapshot.val())
    .then((providers) =>
      Object.entries(providers).map(([name, values]: [string, any]) => ({
        ...values,
        name,
      }))
    )

  const providers: LegacyMobileMoneyProvider[] = firebaseLocalProviders.filter((provider) =>
    isLegacyMobileMoneyProvider(provider)
  )

  return providers
}

export const filterLegacyMobileMoneyProviders = (
  providers: LegacyMobileMoneyProvider[] | undefined,
  flow: CICOFlow,
  userCountry: string | null,
  selectedTokenId: string
) => {
  if (
    !providers ||
    !userCountry ||
    ![networkConfig.cusdTokenId, networkConfig.celoTokenId].includes(selectedTokenId)
  ) {
    return []
  }

  const activeProviders = providers.filter(
    (provider) =>
      (flow === CICOFlow.CashIn && (provider.cusd.cashIn || provider.celo.cashIn)) ||
      (flow === CICOFlow.CashOut && (provider.cusd.cashOut || provider.celo.cashOut))
  )

  return activeProviders.filter((provider) =>
    provider[selectedTokenId === networkConfig.cusdTokenId ? 'cusd' : 'celo'].countries.includes(
      userCountry
    )
  )
}

export async function fetchExchanges(
  countryCodeAlpha2: string | null,
  tokenId: string
): Promise<ExternalExchangeProvider[] | undefined> {
  // If user location data is not available, default fetching exchanges serving the US
  if (!countryCodeAlpha2) countryCodeAlpha2 = 'us'
  // Standardize cGLD to CELO

  try {
    const resp = await fetchWithTimeout(
      `${networkConfig.fetchExchangesUrl}?country=${countryCodeAlpha2}&tokenId=${tokenId}`,
      undefined,
      getDynamicConfigParams(DynamicConfigs[StatsigDynamicConfigs.WALLET_NETWORK_TIMEOUT_SECONDS])
        .cico * 1000
    )

    if (!resp.ok) {
      throw Error(`Fetch exchanges failed with status ${resp?.status}`)
    }

    Logger.debug(TAG, 'got exchanges')

    return resp.json()
  } catch (error) {
    Logger.error(TAG, 'Failure fetching available exchanges', error)
    throw error
  }
}

export const isUserInputCrypto = (flow: CICOFlow): boolean => flow === CICOFlow.CashOut

/**
 * Get analytics data for provider selection.
 *
 * Used for cico_providers_quote_selected, cico_providers_exchanges_selected and
 * coinbase_pay_flow_start analytics events.
 */
export function getProviderSelectionAnalyticsData({
  normalizedQuotes,
  usdToLocalRate,
  tokenInfo,
  legacyMobileMoneyProviders,
  centralizedExchanges,
  transferCryptoAmount,
  cryptoType,
}: {
  normalizedQuotes: NormalizedQuote[]
  usdToLocalRate: string | null
  tokenInfo?: TokenBalance
  legacyMobileMoneyProviders?: LegacyMobileMoneyProvider[]
  centralizedExchanges?: ExternalExchangeProvider[]
  transferCryptoAmount: number
  cryptoType: string
}): ProviderSelectionAnalyticsData {
  let lowestFeePaymentMethod: PaymentMethod | undefined = undefined
  let lowestFeeProvider: string | undefined = undefined
  let lowestFeeCryptoAmount: BigNumber | null = null
  let lowestFeeKycRequired: boolean | undefined = undefined
  const centralizedExchangesAvailable = !!centralizedExchanges && centralizedExchanges?.length > 0
  const paymentMethodsAvailable: Record<PaymentMethod, boolean> = {
    [PaymentMethod.Bank]: false,
    [PaymentMethod.Card]: false,
    [PaymentMethod.FiatConnectMobileMoney]: false,
    [PaymentMethod.MobileMoney]:
      !!legacyMobileMoneyProviders && legacyMobileMoneyProviders.length > 0,
    [PaymentMethod.Airtime]: false,
  }

  for (const quote of normalizedQuotes) {
    paymentMethodsAvailable[quote.getPaymentMethod()] = true
    if (tokenInfo) {
      const fee = quote.getFeeInCrypto(usdToLocalRate, tokenInfo)
      if (fee && (lowestFeeCryptoAmount === null || fee.isLessThan(lowestFeeCryptoAmount))) {
        lowestFeeCryptoAmount = fee
        lowestFeePaymentMethod = quote.getPaymentMethod()
        lowestFeeProvider = quote.getProviderId()
        lowestFeeKycRequired = !!quote.getKycInfo()
      }
    }
  }

  return {
    transferCryptoAmount,
    cryptoType,
    paymentMethodsAvailable,
    lowestFeePaymentMethod,
    lowestFeeProvider,
    lowestFeeKycRequired,
    centralizedExchangesAvailable,
    lowestFeeCryptoAmount: lowestFeeCryptoAmount?.toNumber(),
    // counts centralized exchanges as single option, since that's how they appear on the Select Providers screen
    totalOptions:
      (centralizedExchangesAvailable ? 1 : 0) +
      (legacyMobileMoneyProviders?.length ?? 0) +
      normalizedQuotes.length,
    networkId: tokenInfo?.networkId,
  }
}

export async function fetchCicoQuotes(
  request: GetCicoQuotesRequest
): Promise<GetCicoQuotesResponse> {
  try {
    const response = await fetchWithTimeout(
      networkConfig.getCicoQuotesUrl,
      composePostObject(request),
      getDynamicConfigParams(DynamicConfigs[StatsigDynamicConfigs.WALLET_NETWORK_TIMEOUT_SECONDS])
        .cico * 1000
    )

    if (!response.ok) {
      throw Error(`Get cico quotes failed with status ${response?.status}`)
    }

    Logger.debug(`${TAG}:fetchCicoQuotes`, 'got cico quotes')

    return response.json()
  } catch (error) {
    Logger.error(`${TAG}:fetchCicoQuotes`, 'Failed to fetch cico quotes', error)
    throw error
  }
}
