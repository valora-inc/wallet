export enum Actions {
  SET_CONNECTED = 'NETWORK_INFO/SET_CONNECTED',
  SET_NETWORK_COUNTRY = 'NETWORK_INFO/SET_NETWORK_COUNTRY',
}

interface SetNetworkConnected {
  type: Actions.SET_CONNECTED
  connected: boolean
}

interface SetNetworkCountry {
  type: Actions.SET_NETWORK_COUNTRY
  country: string
}

export type ActionTypes = SetNetworkConnected | SetNetworkCountry

export const setNetworkConnectivity = (connected: boolean) => ({
  type: Actions.SET_CONNECTED,
  connected,
})

export const setNetworkCountry = (country: string) => ({
  type: Actions.SET_NETWORK_COUNTRY,
  country,
})
