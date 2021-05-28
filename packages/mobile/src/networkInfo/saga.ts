import { getRegionCodeFromCountryCode } from '@celo/utils/lib/phoneNumbers'
import NetInfo, { NetInfoState } from '@react-native-community/netinfo'
import { getIpAddress } from 'react-native-device-info'
import { eventChannel } from 'redux-saga'
import { call, cancelled, put, select, spawn, take } from 'redux-saga/effects'
import { defaultCountryCodeSelector } from 'src/account/selectors'
import { FETCH_TIMEOUT_DURATION } from 'src/config'
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
    const response: Response = yield call(
      fetchWithTimeout,
      networkConfig.fetchUserLocationDataUrl,
      null,
      FETCH_TIMEOUT_DURATION
    )

    userLocationData = yield call(response.json)

    if (!response.ok) {
      throw new Error(`IP address fetch failed. Error: ${JSON.stringify(userLocationData)}`)
    }
  } catch (error) {
    Logger.error(`${TAG}:fetchUserLocationData`, error.message)
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

  yield put(updateUserLocationData(userLocationData))
}

export function* networkInfoSaga() {
  yield spawn(subscribeToNetworkStatus)
  yield spawn(fetchUserLocationData)
}
