import { createSelector } from 'reselect'
import { startOnboardingTimeSelector } from 'src/account/selectors'
import { walletAddressSelector } from 'src/web3/selectors'
import { StatsigUser } from 'statsig-react-native'

export const statsigUserSelector = createSelector(
  [walletAddressSelector, startOnboardingTimeSelector],
  (walletAddress, startOnboardingTime): StatsigUser => ({
    userID: walletAddress ?? undefined,
    custom: {
      startOnboardingTime,
    },
  })
)
