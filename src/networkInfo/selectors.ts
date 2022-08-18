import { SANCTIONED_COUNTRIES } from 'src/config'
import { RootState } from 'src/redux/reducers'

export const networkConnectedSelector = (state: RootState) => state.networkInfo.connected
export const userLocationDataSelector = (state: RootState) => state.networkInfo.userLocationData
export const userInSanctionedCountrySelector = (state: RootState) =>
  SANCTIONED_COUNTRIES.includes(state.networkInfo.userLocationData.countryCodeAlpha2 ?? '')
