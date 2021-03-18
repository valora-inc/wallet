import { getRegionCodeFromCountryCode } from '@celo/utils/lib/phoneNumbers'
import { default as DeviceInfo } from 'react-native-device-info'
import getIpAddress from 'react-native-public-ip'
import { showError } from 'src/alert/actions'
import { ErrorMessages } from 'src/app/ErrorMessages'
import {
  DEFAULT_TESTNET,
  PROVIDER_URL_COMPOSER_PROD,
  PROVIDER_URL_COMPOSER_STAGING,
  USER_DATA_URL,
} from 'src/config'
import MoonPay from 'src/fiatExchanges/MoonPay'
import { CicoProviderData } from 'src/fiatExchanges/ProviderOptionsScreen'
import { CiCoProvider } from 'src/fiatExchanges/reducer'
import { providerAvailability } from 'src/flags'
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

export const fetchProviderWidgetUrl = async (
  provider: CiCoProvider,
  requestData: WidgetRequestData
) => {
  try {
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
  } catch (error) {
    Logger.error(TAG, error.message)
    showError(ErrorMessages.PROVIDER_URL_FETCH_FAILED)
  }
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

    if (userAccountCreationData.ipAddress === '') {
      throw Error('No account creation data currently in database')
    }
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

// Leaving unoptimized for now because sorting is most relevant when fees will be visible
export const sortProviders = (provider1: CicoProviderData, provider2: CicoProviderData) => {
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
