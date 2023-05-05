import { navigate, navigateHome } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { getExperimentParams } from 'src/statsig'
import { ExperimentConfigs } from 'src/statsig/constants'
import { StatsigExperiments } from 'src/statsig/types'

export const navigateToFiatExchangeStart = () => {
  if (
    getExperimentParams(ExperimentConfigs[StatsigExperiments.HOME_SCREEN_ACTIONS])
      .showAddWithdrawOnMenu
  ) {
    navigate(Screens.FiatExchange)
  } else {
    navigateHome()
  }
}
