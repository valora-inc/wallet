import { getRegionCodeFromCountryCode } from '@celo/utils/lib/phoneNumbers'
import firebase from '@react-native-firebase/app'
import {
  CurrencyCode,
  DEFAULT_TESTNET,
  MOONPAY_API_KEY,
  PROVIDER_URL_COMPOSER_PROD,
  PROVIDER_URL_COMPOSER_STAGING,
  SIMPLEX_URI,
} from 'src/config'
import { CicoProvider } from 'src/fiatExchanges/ProviderOptionsScreen'
import { CicoProviderNames } from 'src/fiatExchanges/reducer'
import { CicoServiceFeesPolicy } from 'src/fiatExchanges/services/CicoService.abstract'
import { providerAvailability } from 'src/flags'
import { CURRENCY_ENUM } from 'src/geth/consts'
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

export const fetchProviderWidgetUrl = async (
  provider: CicoProviderNames,
  requestData: RequestData
) => {
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
  if (provider1.restricted) {
    return 1
  }

  return -1
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
  countryCode: string | null,
  selectedCurrency: CURRENCY_ENUM
) => {
  if (!localCicoProviders || !countryCode) {
    return []
  }

  const activeLocalProviders = localCicoProviders.filter(
    (provider) =>
      (isCashIn && (provider.cusd.cashIn || provider.celo.cashIn)) ||
      (!isCashIn && (provider.cusd.cashOut || provider.celo.cashOut))
  )

  let availableLocalProviders: LocalCicoProvider[] = []

  const regionCode = getRegionCodeFromCountryCode(countryCode)
  if (regionCode) {
    availableLocalProviders = activeLocalProviders.filter((provider) =>
      provider[selectedCurrency === CURRENCY_ENUM.DOLLAR ? 'cusd' : 'celo'].countries.includes(
        regionCode
      )
    )
  }

  return availableLocalProviders
}

export const renderFeesPolicy = (feesPolicy?: CicoServiceFeesPolicy) => {
  if (!feesPolicy) {
    return 'Unknown'
  }
  const { percentage, extraPercentage, minimum, extraNetwork } = feesPolicy
  const policy = []
  if (!isNaN(percentage as any)) {
    policy.push(percentage + '%')
  } else if (percentage instanceof Array) {
    policy.push(`${percentage[0]}%~${percentage[1]}%`)
  }
  if (extraPercentage) {
    policy.push(`+ $${extraPercentage.toFixed(2)}`)
  }
  if (minimum) {
    policy.push(`($${minimum.toFixed(2)} minimum)`)
  }
  if (extraNetwork) {
    policy.push('+ network fee')
  }
  return policy.join(' ')
}
