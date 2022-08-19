import { createSelector } from 'reselect'
import { SANCTIONED_COUNTRIES } from 'src/config'
import { RootState } from 'src/redux/reducers'

export const networkConnectedSelector = (state: RootState) => state.networkInfo.connected
export const userLocationDataSelector = (state: RootState) => state.networkInfo.userLocationData
export const userInSanctionedCountrySelector = createSelector(
  userLocationDataSelector,
  (userLocationData) => SANCTIONED_COUNTRIES.includes(userLocationData.countryCodeAlpha2 ?? '')
)
