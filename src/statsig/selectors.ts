import { createSelector } from 'reselect'
import { startOnboardingTimeSelector } from 'src/account/selectors'
import { statsigLoadTimeSelector } from 'src/app/selectors'
import { walletAddressSelector } from 'src/web3/selectors'
import { StatsigUser } from 'statsig-react-native'

export const statsigUserSelector = createSelector(
  [walletAddressSelector, startOnboardingTimeSelector, statsigLoadTimeSelector],
  (walletAddress, startOnboardingTime, loadTime): StatsigUser => ({
    userID: walletAddress ?? undefined,
    custom: {
      startOnboardingTime,
      loadTime,
    },
  })
)
