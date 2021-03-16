import { getRegionCodeFromCountryCode } from '@celo/utils/lib/phoneNumbers'
import { default as DeviceInfo } from 'react-native-device-info'
import getIpAddress from 'react-native-public-ip'
import {
  DEFAULT_TESTNET,
  PROVIDER_URL_COMPOSER_PROD,
  PROVIDER_URL_COMPOSER_STAGING,
  USER_DATA_URL,
} from 'src/config'
import MoonPay from 'src/fiatExchanges/MoonPay'
import { Providers } from 'src/fiatExchanges/ProviderOptionsScreen'
import { providerAvailability } from 'src/flags'

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

export const fetchProviderWidgetUrl = async (
  provider: Providers,
  requestData: WidgetRequestData
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

export const fetchUserLocationData = async (countryCallingCode: string | null) => {
  let userLocationData: UserLocationData
  try {
    const { alpha2, state, ipAddress } = await MoonPay.fetchUserLocationData()
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

export const fetchUserAccountCreationData = async (currentIpAddress: string) => {
  let userAccountCreationData: UserAccountCreationData
  try {
    const response = await fetch(USER_DATA_URL, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        deviceId: DeviceInfo.getUniqueId(),
      }),
    })

    userAccountCreationData = await response.json()
  } catch (error) {
    // If account creation data fetch fails or there is no data stored, default to current device info
    userAccountCreationData = {
      ipAddress: currentIpAddress,
      // Using new Date because DeviceInfo.getFirstInstallTime returns incorrect date
      timestamp: new Date().toISOString(),
      userAgent: DeviceInfo.getUserAgentSync(),
    }
  }

  return userAccountCreationData
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
