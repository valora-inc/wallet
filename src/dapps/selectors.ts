import { RootState } from 'src/redux/reducers'

export const dappsListApiUrlSelector = (state: RootState) => state.dapps.dappListApiUrl

export const maxNumRecentDappsSelector = (state: RootState) => state.dapps.maxNumRecentDapps

export const recentDappsSelector = (state: RootState) => state.dapps.recentDapps

export const activeDappSelector = (state: RootState) =>
  state.dapps.dappsWebViewEnabled ? state.dapps.activeDapp : null

export const dappsWebViewEnabledSelector = (state: RootState) => state.dapps.dappsWebViewEnabled

export const allDappsSelector = (state: RootState) => state.dapps.allDapps
