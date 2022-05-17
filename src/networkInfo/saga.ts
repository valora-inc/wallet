import { getRegionCodeFromCountryCode } from '@celo/utils/lib/phoneNumbers'
import NetInfo, { NetInfoState } from '@react-native-community/netinfo'
import { getIpAddress } from 'react-native-device-info'
import { eventChannel } from 'redux-saga'
import { call, cancelled, put, select, spawn, take } from 'redux-saga/effects'
import { defaultCountryCodeSelector } from 'src/account/selectors'
import { isE2EEnv } from 'src/config'
import networkConfig from 'src/geth/networkConfig'
import { setNetworkConnectivity, updateUserLocationData } from 'src/networkInfo/actions'
import { fetchWithTimeout } from 'src/utils/fetchWithTimeout'
import Logger from 'src/utils/Logger'

const TAG = 'networkInfo/saga'

export interface UserLocationData {
  countryCodeAlpha2: string | null
  region: string | null
  ipAddress: string | null
}

interface ErrorResponse {
  error: string
}

function createNetworkStatusChannel() {
  return eventChannel((emit) => {
    return NetInfo.addEventListener((state) => emit(state))
  })
}

const MOCK_USER_LOCATION = {
  countryCodeAlpha2: 'DE',
  region: null,
  ipAddress: '1.1.1.7',
}

const isConnected = (connectionInfo: NetInfoState) => {
  return connectionInfo.type !== 'none'
}

const isErrorResponse = (response: UserLocationData | ErrorResponse): response is ErrorResponse =>
  !!(response as ErrorResponse).error

function* subscribeToNetworkStatus() {
  const networkStatusChannel = yield createNetworkStatusChannel()
  let connectionInfo: NetInfoState = yield call(NetInfo.fetch)
  let isNetworkConnected = isConnected(connectionInfo)
  Logger.setIsNetworkConnected(isNetworkConnected)
  yield put(setNetworkConnectivity(isNetworkConnected))
  while (true) {
    try {
      connectionInfo = yield take(networkStatusChannel)
      isNetworkConnected = isConnected(connectionInfo)
      Logger.setIsNetworkConnected(isNetworkConnected)
      yield put(setNetworkConnectivity(isNetworkConnected))
    } catch (error) {
      Logger.error(`${TAG}@subscribeToNetworkStatus`, 'Failed to watch network status', error)
    } finally {
      if (yield cancelled()) {
        networkStatusChannel.close()
      }
    }
  }
}

export function* fetchUserLocationData() {
  let userLocationData: UserLocationData | ErrorResponse
  try {
    const response: Response = yield call(fetchWithTimeout, networkConfig.fetchUserLocationDataUrl)
    userLocationData = yield call([response, 'json'])

    if (isErrorResponse(userLocationData)) {
      throw new Error(
        `IP address fetch failed with status code ${response.status}. Error: ${userLocationData.error}}`
      )
    }
  } catch (error) {
    Logger.error(`${TAG}:fetchUserLocationData`, 'Failed to fetch user location', error)
    // If endpoint fails then use country code to determine location
    const countryCallingCode: string | null = yield select(defaultCountryCodeSelector)
    const countryCodeAlpha2 = countryCallingCode
      ? getRegionCodeFromCountryCode(countryCallingCode)
      : null
    let ipAddress: string | null
    try {
      ipAddress = yield call(getIpAddress)
    } catch (error) {
      ipAddress = null
    }

    userLocationData = { countryCodeAlpha2, region: null, ipAddress }
  }

  yield isE2EEnv
    ? put(updateUserLocationData(MOCK_USER_LOCATION))
    : put(updateUserLocationData(userLocationData))
}

export function* networkInfoSaga() {
  yield spawn(subscribeToNetworkStatus)
  yield spawn(fetchUserLocationData)
}
