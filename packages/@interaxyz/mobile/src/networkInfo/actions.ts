import { UserLocationData } from 'src/networkInfo/saga'

export enum Actions {
  SET_CONNECTED = 'NETWORK_INFO/SET_CONNECTED',
  UPDATE_USER_LOCATION_DATA = 'NETWORK_INFO/UPDATE_USER_LOCATION_DATA',
}

interface SetNetworkConnected {
  type: Actions.SET_CONNECTED
  connected: boolean
}

interface UpdateUserLocationData {
  type: Actions.UPDATE_USER_LOCATION_DATA
  userLocationData: UserLocationData
}

export type ActionTypes = SetNetworkConnected | UpdateUserLocationData

export const setNetworkConnectivity = (connected: boolean) => ({
  type: Actions.SET_CONNECTED,
  connected,
})

export const updateUserLocationData = (userLocationData: UserLocationData) => ({
  type: Actions.UPDATE_USER_LOCATION_DATA,
  userLocationData,
})
