import { getRegionCodeFromCountryCode } from '@celo/utils/lib/phoneNumbers'
import { default as DeviceInfo } from 'react-native-device-info'
import getIpAddress from 'react-native-public-ip'
import { showError } from 'src/alert/actions'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { CurrencyCode, MOONPAY_API_KEY } from 'src/config'
import { CicoProvider } from 'src/fiatExchanges/ProviderOptionsScreen'
import { CicoProviderNames } from 'src/fiatExchanges/reducer'
import { providerAvailability } from 'src/flags'
import networkConfig from 'src/geth/networkConfig'
import { LocalCurrencyCode } from 'src/localCurrency/consts'
import Logger from 'src/utils/Logger'

const TAG = 'fiatExchanges:utils'
interface WidgetRequestData {
  address: string | null
  digitalAsset: string
  fiatCurrency: string
  fiatAmount: number
}

export interface UserLocationData {
  country: string | null
  state: string | null
  ipAddress: string | null
}

export interface UserAccountCreationData {
  ipAddress: string
  timestamp: string
  userAgent: string
}
interface MoonPayIpAddressData {
  alpha2: string
  alpha3: string
  state: string
  ipAddress: string
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

export const fetchProviderWidgetUrl = async (
  provider: CicoProviderNames,
  requestData: WidgetRequestData
) => {
  try {
    const response = await fetch(
      networkConfig.providerComposerUrl,
      composePostObject({ ...requestData, provider })
    )

    return response.json()
  } catch (error) {
    Logger.error(TAG, error.message)
    showError(ErrorMessages.PROVIDER_URL_FETCH_FAILED)
  }
}

export const fetchUserLocationData = async (countryCallingCode: string | null) => {
  let userLocationData: UserLocationData
  try {
    const ipAddressFetchResponse = await fetch(
      `https://api.moonpay.com/v4/ip_address?apiKey=${MOONPAY_API_KEY}`
    )
    const ipAddressObj: MoonPayIpAddressData = await ipAddressFetchResponse.json()
    const { alpha2, state, ipAddress } = ipAddressObj

    if (!alpha2) {
      throw Error('Could not determine country from IP address')
    }

    userLocationData = { country: alpha2, state, ipAddress }
  } catch (error) {
    // If MoonPay endpoint fails then use country code to determine location
    const country = countryCallingCode ? getRegionCodeFromCountryCode(countryCallingCode) : null
    let ipAddress
    try {
      ipAddress = await getIpAddress()
    } catch (error) {
      ipAddress = null
    }

    userLocationData = { country, state: null, ipAddress }
  }

  return userLocationData
}

export const fetchSimplexQuote = async (
  userAddress: string,
  currentIpAddress: string,
  currencyToBuy: CurrencyCode,
  fiatCurrency: LocalCurrencyCode,
  amount: number,
  amountIsFiat: boolean
) => {
  try {
    const response = await fetch(
      networkConfig.simplexApiUrl,
      composePostObject({
        type: 'quote',
        userAddress,
        currentIpAddress,
        currencyToBuy,
        fiatCurrency,
        amount,
        amountIsFiat,
      })
    )

    const simplexQuoteResponse = await response.json()
    if (simplexQuoteResponse?.error) {
      throw Error(simplexQuoteResponse.error)
    }

    const simplexQuote: SimplexQuote = simplexQuoteResponse
    return simplexQuote
  } catch (error) {
    Logger.error(TAG, error.message)
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
    const response = await fetch(
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

    const simplexPaymentData: SimplexPaymentData = await response.json()
    return simplexPaymentData
  } catch (error) {
    Logger.error(TAG, error.message)
  }
}

export const isExpectedUrl = (fetchedUrl: string, providerUrl: string) =>
  fetchedUrl.startsWith(providerUrl)

type ProviderAvailability = typeof providerAvailability
type SpecificProviderAvailability = { [K in keyof ProviderAvailability]: boolean }

type Entries<T> = Array<{ [K in keyof T]: [K, T[K]] }[keyof T]>

export function getProviderAvailability(
  userLocation: UserLocationData | undefined
): SpecificProviderAvailability {
  const countryCodeAlpha2 = userLocation?.country ?? null
  const stateCode = userLocation?.state ?? null

  // tslint:disable-next-line: no-object-literal-type-assertion
  const features = {} as SpecificProviderAvailability
  for (const [key, value] of Object.entries(providerAvailability) as Entries<
    ProviderAvailability
  >) {
    if (!countryCodeAlpha2) {
      features[key] = false
    } else {
      if (countryCodeAlpha2 === 'US' && (value as any)[countryCodeAlpha2] !== true) {
        features[key] = stateCode ? (value as any)[countryCodeAlpha2][stateCode] ?? false : false
      } else {
        features[key] = (value as any)[countryCodeAlpha2] ?? false
      }
    }
  }
  return features
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

  return -1
}
