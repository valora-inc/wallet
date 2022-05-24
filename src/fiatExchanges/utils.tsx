import firebase from '@react-native-firebase/app'
import { default as DeviceInfo } from 'react-native-device-info'
import { FIREBASE_ENABLED } from 'src/config'
import { ExternalExchangeProvider } from 'src/fiatExchanges/ExternalExchanges'
import networkConfig from 'src/geth/networkConfig'
import { LocalCurrencyCode } from 'src/localCurrency/consts'
import { UserLocationData } from 'src/networkInfo/saga'
import { CiCoCurrency, Currency } from 'src/utils/currencies'
import { fetchWithTimeout } from 'src/utils/fetchWithTimeout'
import Logger from 'src/utils/Logger'

const TAG = 'fiatExchanges:utils'

export enum FiatExchangeFlow {
  CashIn = 'CashIn',
  CashOut = 'CashOut',
  Spend = 'Spend',
}

export enum CICOFlow {
  CashIn = 'CashIn',
  CashOut = 'CashOut',
}

export enum PaymentMethod {
  Bank = 'Bank',
  Card = 'Card',
  MobileMoney = 'MobileMoney',
}

interface ProviderRequestData {
  userLocation: UserLocationData
  walletAddress: string
  fiatCurrency: LocalCurrencyCode
  digitalAsset: CiCoCurrency
  fiatAmount?: number
  digitalAssetAmount?: number
  txType: 'buy' | 'sell'
}

export interface FetchProvidersOutput {
  name: string
  restricted: boolean
  unavailable?: boolean
  paymentMethods: PaymentMethod[]
  url?: string
  logoWide: string
  logo: string
  quote?: RawSimplexQuote | RawProviderQuote[]
  cashIn: boolean
  cashOut: boolean
}

export interface UserAccountCreationData {
  ipAddress: string
  timestamp: string
  userAgent: string
}

interface RawProviderQuote {
  paymentMethod: PaymentMethod
  digitalAsset: string
  returnedAmount: number
  fiatFee: number
}

interface RawSimplexQuote {
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

export interface ProviderInfo {
  name: string
  logoWide: string
  logo: string
}

export type ProviderQuote = RawProviderQuote & {
  cashIn: boolean
  cashOut: boolean
  url: string
}

export type SimplexQuote = RawSimplexQuote & {
  cashIn: boolean
  cashOut: boolean
  paymentMethod: PaymentMethod
}

export interface CicoQuote {
  quote: ProviderQuote | SimplexQuote
  provider: ProviderInfo
}

export const getQuotes = (providers: FetchProvidersOutput[] | undefined): CicoQuote[] => {
  if (!providers) {
    return []
  }
  const cicoQuotes: CicoQuote[] = []
  providers.forEach((provider) => {
    if (!provider.quote || provider.restricted || provider.unavailable) return
    if (Array.isArray(provider.quote)) {
      provider.quote.forEach((quote) => {
        cicoQuotes.push({
          quote: {
            ...quote,
            cashIn: provider.cashIn,
            cashOut: provider.cashOut,
            url: provider.url || '',
          },
          provider: {
            name: provider.name,
            logo: provider.logo,
            logoWide: provider.logoWide,
          },
        })
      })
    } else {
      // Simplex
      cicoQuotes.push({
        quote: {
          ...provider.quote,
          cashIn: provider.cashIn,
          cashOut: provider.cashOut,
          paymentMethod: provider.paymentMethods[0],
        },
        provider: {
          name: provider.name,
          logo: provider.logo,
          logoWide: provider.logoWide,
        },
      })
    }
  })
  return cicoQuotes
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
): Promise<FetchProvidersOutput[] | undefined> => {
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
    Logger.error(`${TAG}:fetchProviders`, 'Failed to fetch providers', error)
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
    Logger.error(`${TAG}:fetchSimplexPaymentData`, 'Failed to fetch simplex payment data', error)
    throw error
  }
}

export const isSimplexQuote = (
  quote?: SimplexQuote | ProviderQuote | RawProviderQuote | RawSimplexQuote
): quote is SimplexQuote => !!quote && 'wallet_id' in quote

export const isProviderQuote = (
  quote?: SimplexQuote | ProviderQuote | RawProviderQuote | RawSimplexQuote
): quote is ProviderQuote => !!quote && 'returnedAmount' in quote

export const getFeeValueFromQuotes = (quote?: SimplexQuote | ProviderQuote) => {
  if (isSimplexQuote(quote)) {
    return quote.fiat_money.total_amount - quote.fiat_money.base_amount
  }
  return quote?.fiatFee
}

export const sortQuotesByFee = ({ quote: quote1 }: CicoQuote, { quote: quote2 }: CicoQuote) => {
  const providerFee1 = getFeeValueFromQuotes(quote1) ?? 0
  const providerFee2 = getFeeValueFromQuotes(quote2) ?? 0

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
  selectedCurrency: CiCoCurrency
) => {
  if (
    !providers ||
    !userCountry ||
    ![CiCoCurrency.CUSD, CiCoCurrency.CELO].includes(selectedCurrency)
  ) {
    return []
  }

  const activeProviders = providers.filter(
    (provider) =>
      (flow === CICOFlow.CashIn && (provider.cusd.cashIn || provider.celo.cashIn)) ||
      (flow === CICOFlow.CashOut && (provider.cusd.cashOut || provider.celo.cashOut))
  )

  return activeProviders.filter((provider) =>
    provider[selectedCurrency === CiCoCurrency.CUSD ? 'cusd' : 'celo'].countries.includes(
      userCountry
    )
  )
}

export async function fetchExchanges(
  countryCodeAlpha2: string | null,
  currency: string
): Promise<ExternalExchangeProvider[] | undefined> {
  // If user location data is not available, default fetching exchanges serving the US
  if (!countryCodeAlpha2) countryCodeAlpha2 = 'us'
  // Standardize cGLD to CELO
  if (currency == Currency.Celo) currency = 'CELO'

  try {
    const resp = await fetch(
      `${networkConfig.fetchExchangesUrl}?country=${countryCodeAlpha2}&currency=${currency}`
    )

    if (!resp.ok) {
      throw Error(`Fetch exchanges failed with status ${resp?.status}`)
    }

    return resp.json()
  } catch (error) {
    Logger.error(TAG, 'Failure fetching available exchanges', error)
    throw error
  }
}
