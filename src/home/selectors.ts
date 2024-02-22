import _ from 'lodash'
import DeviceInfo from 'react-native-device-info'
import { createSelector } from 'reselect'
import { userLocationDataSelector } from 'src/networkInfo/selectors'
import { RootState } from 'src/redux/reducers'
import { getFeatureGate } from 'src/statsig'
import { StatsigFeatureGates } from 'src/statsig/types'
import { isVersionInRange } from 'src/utils/versionCheck'

const homeNotificationsSelector = (state: RootState) => state.home.notifications

export const getExtraNotifications = createSelector(
  [homeNotificationsSelector, userLocationDataSelector],
  (notifications, userLocationData) => {
    const version = DeviceInfo.getVersion()
    const { countryCodeAlpha2 } = userLocationData
    return _.pickBy(notifications, (notification) => {
      return (
        !!notification &&
        !notification.dismissed &&
        isVersionInRange(version, notification.minVersion, notification.maxVersion) &&
        (notification.countries?.length
          ? !!countryCodeAlpha2 && notification.countries.includes(countryCodeAlpha2)
          : true) &&
        (notification.blockedCountries?.length
          ? !!countryCodeAlpha2 && !notification.blockedCountries.includes(countryCodeAlpha2)
          : true)
      )
    })
  }
)

export const cleverTapInboxMessagesSelector = (state: RootState) =>
  getFeatureGate(StatsigFeatureGates.CLEVERTAP_INBOX) ? state.home.cleverTapInboxMessages : []

export const hasVisitedHomeSelector = (state: RootState) => state.home.hasVisitedHome

export const celebratedNftSelector = (state: RootState) => {
  if (!state.home.nftCelebration) {
    return null
  }

  const { networkId, contractAddress } = state.home.nftCelebration

  return {
    networkId,
    contractAddress,
  }
}

export const showNftCelebrationSelector = (state: RootState) => {
  const featureGateEnabled = getFeatureGate(StatsigFeatureGates.SHOW_NFT_CELEBRATION)
  if (!featureGateEnabled) {
    return false
  }

  if (!state.home.nftCelebration) {
    return false
  }

  return !state.home.nftCelebration.displayed
}
