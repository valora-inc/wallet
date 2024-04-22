import { isPast } from 'date-fns/isPast'
import _ from 'lodash'
import DeviceInfo from 'react-native-device-info'
import { createSelector } from 'reselect'
import { NftCelebrationStatus } from 'src/home/reducers'
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

export const nftCelebrationSelector = (state: RootState) => {
  return state.home.nftCelebration
}

export const showNftCelebrationSelector = (state: RootState) => {
  const featureGateEnabled = getFeatureGate(StatsigFeatureGates.SHOW_NFT_CELEBRATION)
  if (!featureGateEnabled) {
    return false
  }

  if (!state.home.nftCelebration) {
    return false
  }

  return state.home.nftCelebration.status === NftCelebrationStatus.celebrationReadyToDisplay
}

export const showNftRewardSelector = (state: RootState) => {
  const featureGateEnabled = getFeatureGate(StatsigFeatureGates.SHOW_NFT_REWARD)
  if (!featureGateEnabled) {
    return false
  }

  if (!state.home.nftCelebration) {
    return false
  }

  if (isPast(new Date(state.home.nftCelebration.rewardExpirationDate))) {
    return false
  }

  return (
    state.home.nftCelebration.status === NftCelebrationStatus.rewardReadyToDisplay ||
    state.home.nftCelebration.status === NftCelebrationStatus.reminderReadyToDisplay
  )
}
