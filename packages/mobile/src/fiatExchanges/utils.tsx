import firebase from '@react-native-firebase/app'
import { default as DeviceInfo } from 'react-native-device-info'
import { CurrencyCode } from 'src/config'
import { PaymentMethod } from 'src/fiatExchanges/FiatExchangeOptions'
import { CicoProvider } from 'src/fiatExchanges/ProviderOptionsScreen'
import { CURRENCY_ENUM } from 'src/geth/consts'
import networkConfig from 'src/geth/networkConfig'
import { LocalCurrencyCode } from 'src/localCurrency/consts'
import { UserLocationData } from 'src/networkInfo/saga'
import { fetchWithTimeout } from 'src/utils/fetchWithTimeout'
import Logger from 'src/utils/Logger'

const TAG = 'fiatExchanges:utils'

interface ProviderRequestData {
  userLocation: UserLocationData
  walletAddress: string
  fiatCurrency: LocalCurrencyCode
  digitalAsset: CurrencyCode
  fiatAmount?: number
  digitalAssetAmount?: number
  txType: 'buy' | 'sell'
}

export interface UserAccountCreationData {
  ipAddress: string
  timestamp: string
  userAgent: string
}

export interface ProviderQuote {
  paymentMethod: PaymentMethod
  digitalAsset: string
  returnedAmount: number
  fiatFee: number
}

export interface SimplexQuote {
  user_id: string
  quote_id: string
  wallet_id: string
  digital_money: {
    currency: string
    amount: number
  }
  fiat_money: {
    currency: string
    base_amount: number
    total_amount: number
  }
  valid_until: string
  supported_digital_currencies: string[]
}
export interface LocalCicoProvider {
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

export const fetchProviders = async (
  requestData: ProviderRequestData
): Promise<CicoProvider[] | undefined> => {
  try {
    const response = await fetchWithTimeout(
      networkConfig.providerFetchUrl,
      composePostObject(requestData)
    )

    if (!response.ok) {
      throw Error(`Fetch failed with status ${response?.status}`)
    }

    return response.json()
  } catch (error) {
    Logger.error(`${TAG}:fetchProviders`, error.message)
    throw error
  }
}

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
      })
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
    Logger.error(`${TAG}:fetchSimplexPaymentData`, error.message)
    throw error
  }
}

export const isSimplexQuote = (quote?: SimplexQuote | ProviderQuote): quote is SimplexQuote =>
  !!quote && 'wallet_id' in quote

export const isProviderQuote = (quote?: SimplexQuote | ProviderQuote): quote is ProviderQuote =>
  !!quote && 'returnedAmount' in quote

export const getLowestFeeValueFromQuotes = (quote?: SimplexQuote | ProviderQuote[]) => {
  if (!quote) {
    return
  }

  if (Array.isArray(quote)) {
    if (quote.length > 1 && isProviderQuote(quote[0]) && isProviderQuote(quote[1])) {
      return quote[0].fiatFee < quote[1].fiatFee ? quote[0].fiatFee : quote[1].fiatFee
    } else if (isProviderQuote(quote[0])) {
      return quote[0].fiatFee
    }
  } else if (isSimplexQuote(quote)) {
    return quote.fiat_money.total_amount - quote.fiat_money.base_amount
  }
}

// Leaving unoptimized for now because sorting is most relevant when fees will be visible
export const sortProviders = (provider1: CicoProvider, provider2: CicoProvider) => {
  if (provider1.unavailable) {
    return 1
  }

  if (provider2.unavailable) {
    return -1
  }

  if (provider1.restricted) {
    return 1
  }

  if (provider2.restricted) {
    return -1
  }

  if (!provider1.quote) {
    return 1
  }

  if (!provider2.quote) {
    return -1
  }

  const providerFee1 = getLowestFeeValueFromQuotes(provider1.quote)
  const providerFee2 = getLowestFeeValueFromQuotes(provider2.quote)

  if (providerFee1 === undefined) {
    return 1
  }

  if (providerFee2 === undefined) {
    return -1
  }

  return providerFee1 > providerFee2 ? 1 : -1
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

const isLocalCicoProvider = (obj: any): obj is LocalCicoProvider => {
  return (
    typeof obj.name === 'string' &&
    typeCheckNestedProperties(obj, 'celo') &&
    typeCheckNestedProperties(obj, 'cusd')
  )
}

export const fetchLocalCicoProviders = async () => {
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

  const localCicoProviders: LocalCicoProvider[] = firebaseLocalProviders.filter((provider) =>
    isLocalCicoProvider(provider)
  )

  return localCicoProviders
}

export const getAvailableLocalProviders = (
  localCicoProviders: LocalCicoProvider[] | undefined,
  isCashIn: boolean,
  userCountry: string | null,
  selectedCurrency: CURRENCY_ENUM
) => {
  if (!localCicoProviders || !userCountry) {
    return []
  }

  const activeLocalProviders = localCicoProviders.filter(
    (provider) =>
      (isCashIn && (provider.cusd.cashIn || provider.celo.cashIn)) ||
      (!isCashIn && (provider.cusd.cashOut || provider.celo.cashOut))
  )

  return activeLocalProviders.filter((provider) =>
    provider[selectedCurrency === CURRENCY_ENUM.DOLLAR ? 'cusd' : 'celo'].countries.includes(
      userCountry
    )
  )
}
