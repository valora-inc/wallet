import { createSelector } from 'reselect'
import { RootState } from 'src/redux/reducers'
import { getCountryFeatures } from 'src/utils/countryFeatures'

export const networkConnectedSelector = (state: RootState) => state.networkInfo.connected
export const userLocationDataSelector = (state: RootState) => state.networkInfo.userLocationData

export const userInSanctionedCountrySelector = createSelector(
  userLocationDataSelector,
  (userLocationData: { countryCodeAlpha2: any }) =>
    getCountryFeatures(userLocationData.countryCodeAlpha2 ?? '').SANCTIONED_COUNTRY ?? false
)
