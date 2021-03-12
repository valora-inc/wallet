import {
  CurrencyCode,
  DEFAULT_TESTNET,
  MOONPAY_API_KEY,
  PROVIDER_URL_COMPOSER_PROD,
  PROVIDER_URL_COMPOSER_STAGING,
  USER_DATA_URL,
} from 'src/config'
import { Providers } from 'src/fiatExchanges/ProviderOptionsScreen'
import { providerAvailability } from 'src/flags'
import { LocalCurrencyCode } from 'src/localCurrency/consts'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'

interface RequestData {
  address: string | null
  digitalAsset: string
  fiatCurrency: string
  fiatAmount: number
}

interface IpAddressData {
  alpha2: string
  alpha3: string
  state: string
  ipAddress: string
}

export interface UserLocation {
  country: string | null
  state: string | null
}

export const fetchProviderWidgetUrl = async (provider: Providers, requestData: RequestData) => {
  const response = await fetch(
    DEFAULT_TESTNET === 'mainnet' ? PROVIDER_URL_COMPOSER_PROD : PROVIDER_URL_COMPOSER_STAGING,
    {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...requestData,
        provider,
      }),
    }
  )

  return response.json()
}

export const fetchLocationFromIpAddress = async () => {
  const ipAddressFetchResponse = await fetch(
    `https://api.moonpay.com/v4/ip_address?apiKey=${MOONPAY_API_KEY}`
  )
  const ipAddressObj: IpAddressData = await ipAddressFetchResponse.json()
  return ipAddressObj
}

export const fetchUserInitData = async (deviceId: string) => {
  const response = await fetch(USER_DATA_URL, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      deviceId,
    }),
  })

  return response.json()
}

export const isExpectedUrl = (fetchedUrl: string, providerUrl: string) =>
  fetchedUrl.startsWith(providerUrl)

export const openMoonpay = (
  amount: number,
  currencyCode: LocalCurrencyCode,
  currencyToBuy: CurrencyCode
) => {
  navigate(Screens.MoonPayScreen, {
    localAmount: amount,
    currencyCode,
    currencyToBuy,
  })
}

export const openSimplex = (
  amount: number,
  currencyCode: LocalCurrencyCode,
  currencyToBuy: CurrencyCode
) => {
  navigate(Screens.Simplex, {
    localAmount: amount,
    currencyCode,
    currencyToBuy,
  })
}

export const openRamp = (
  amount: number,
  currencyCode: LocalCurrencyCode,
  currencyToBuy: CurrencyCode
) => {
  navigate(Screens.RampScreen, {
    localAmount: amount,
    currencyCode,
    currencyToBuy,
  })
}

export const openTransak = (
  amount: number,
  currencyCode: LocalCurrencyCode,
  currencyToBuy: CurrencyCode
) => {
  navigate(Screens.TransakScreen, {
    localAmount: amount,
    currencyCode,
    currencyToBuy,
  })
}

type ProviderAvailability = typeof providerAvailability
type SpecificProviderAvailability = { [K in keyof ProviderAvailability]: boolean }

type Entries<T> = Array<{ [K in keyof T]: [K, T[K]] }[keyof T]>

export function getProviderAvailability(
  userLocation: UserLocation | undefined
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
