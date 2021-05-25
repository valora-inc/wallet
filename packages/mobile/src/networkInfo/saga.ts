import { getRegionCodeFromCountryCode } from '@celo/utils/lib/phoneNumbers'
import NetInfo, { NetInfoState } from '@react-native-community/netinfo'
import { getIpAddress } from 'react-native-device-info'
import { eventChannel } from 'redux-saga'
import { call, cancelled, put, select, spawn, take } from 'redux-saga/effects'
import { defaultCountryCodeSelector } from 'src/account/selectors'
import { FETCH_TIMEOUT_DURATION } from 'src/config'
import { setNetworkConnectivity, updateUserLocationData } from 'src/networkInfo/actions'
import { fetchWithTimeout } from 'src/utils/fetchWithTimeout'
import Logger from 'src/utils/Logger'

const TAG = 'networkInfo/saga'

interface IpAddressData {
  ip: string
  version: string
  city: string
  region: string
  region_code: string
  country: string
  country_name: string
  country_code: string
  country_code_iso3: string
  country_capital: string
  country_tld: string
  continent_code: string
  in_eu: boolean
  postal: number
  latitude: number
  longitude: number
  timezone: string
  utc_offset: number
  country_calling_code: string
  currency: string
  currency_name: string
  languages: string
  country_area: number
  country_population: number
  asn: string
  org: string
}

export interface UserLocationData {
  country: string | null
  state: string | null
  ipAddress: string | null
}

function createNetworkStatusChannel() {
  return eventChannel((emit) => {
    return NetInfo.addEventListener((state) => emit(state))
  })
}

const isConnected = (connectionInfo: NetInfoState) => {
  return connectionInfo.type !== 'none'
}

function* subscribeToNetworkStatus() {
  const networkStatusChannel = yield createNetworkStatusChannel()
  let connectionInfo: NetInfoState = yield call(NetInfo.fetch)
  yield put(setNetworkConnectivity(isConnected(connectionInfo)))
  while (true) {
    try {
      connectionInfo = yield take(networkStatusChannel)
      yield put(setNetworkConnectivity(isConnected(connectionInfo)))
    } catch (error) {
      Logger.error(`${TAG}@subscribeToNetworkStatus`, error)
    } finally {
      if (yield cancelled()) {
        networkStatusChannel.close()
      }
    }
  }
}

function* fetchUserLocationData() {
  let userLocationData: UserLocationData
  try {
    // NOTE: Need to pay for this API if we decide to use it at scale
    const response: Response = yield fetchWithTimeout(
      'https://ipapi.co/json/',
      null,
      FETCH_TIMEOUT_DURATION
    )

    const ipAddressData: IpAddressData = yield response.json()

    if (!response.ok) {
      throw Error(`IP address fetch failed. Error: ${JSON.stringify(ipAddressData)}`)
    }

    const { country_code, region_code, ip } = ipAddressData
    userLocationData = { country: country_code, state: region_code, ipAddress: ip }
  } catch (error) {
    Logger.error(`${TAG}:fetchUserLocationData`, error.message)
    // If endpoint fails then use country code to determine location
    const countryCallingCode: string | null = yield select(defaultCountryCodeSelector)
    const country = countryCallingCode ? getRegionCodeFromCountryCode(countryCallingCode) : null
    let ipAddress: string | null
    try {
      ipAddress = yield getIpAddress()
    } catch (error) {
      ipAddress = null
    }

    userLocationData = { country, state: null, ipAddress }
  }

  yield put(updateUserLocationData(userLocationData))
}

export function* networkInfoSaga() {
  yield spawn(subscribeToNetworkStatus)
  yield spawn(fetchUserLocationData)
}
