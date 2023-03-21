import { getExperimentParams } from 'src/statsig'
import { ExperimentConfigs } from 'src/statsig/constants'
import { StatsigExperiments } from 'src/statsig/types'

export function getOnboardingExperimentParams() {
  const { onboardingNameScreenEnabled, chooseAdventureEnabled } = getExperimentParams(
    ExperimentConfigs[StatsigExperiments.CHOOSE_YOUR_ADVENTURE]
  )
  return {
    ...getExperimentParams(ExperimentConfigs[StatsigExperiments.RECOVERY_PHRASE_IN_ONBOARDING]),
    chooseAdventureEnabled,
    onboardingNameScreenEnabled,
  }
}
