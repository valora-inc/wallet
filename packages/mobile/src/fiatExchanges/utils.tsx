import {
  CurrencyCode,
  DEFAULT_TESTNET,
  IP_ADDRESS_LOCATION_URL_PROD,
  IP_ADDRESS_LOCATION_URL_STAGING,
  PROVIDER_URL_COMPOSER_PROD,
  PROVIDER_URL_COMPOSER_STAGING,
  SIMPLEX_URI,
} from 'src/config'
import { Providers } from 'src/fiatExchanges/ProviderOptionsScreen'
import { providerAvailability } from 'src/flags'
import { LocalCurrencyCode } from 'src/localCurrency/consts'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { navigateToURI } from 'src/utils/linking'

interface RequestData {
  address: string | null
  digitalAsset: string
  fiatCurrency: string
  fiatAmount: number
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
        env: DEFAULT_TESTNET === 'mainnet' ? 'production' : 'staging',
      }),
    }
  )

  return response.json()
}

export const fetchUserIpAddress = async () => {
  const response = await fetch(
    DEFAULT_TESTNET === 'mainnet' ? IP_ADDRESS_LOCATION_URL_PROD : IP_ADDRESS_LOCATION_URL_STAGING,
    {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        urlType: 'ip',
        env: DEFAULT_TESTNET === 'mainnet' ? 'production' : 'staging',
      }),
    }
  )

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

export const openSimplex = (account: string | null) => {
  navigateToURI(`${SIMPLEX_URI}?address=${account}`)
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
  // tslint:disable-next-line: no-object-literal-type-assertion
  const { countryCodeAlpha2, stateCode } = userLocation
    ? { countryCodeAlpha2: userLocation.country, stateCode: userLocation.state }
    : { countryCodeAlpha2: null, stateCode: null }

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
