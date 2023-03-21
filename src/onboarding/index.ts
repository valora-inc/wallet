import { getExperimentParams } from 'src/statsig'
import { ExperimentConfigs } from 'src/statsig/constants'
import { StatsigExperiments } from 'src/statsig/types'

export function getOnboardingExperimentParams() {
  return {
    ...getExperimentParams(ExperimentConfigs[StatsigExperiments.RECOVERY_PHRASE_IN_ONBOARDING]),
    ...getExperimentParams(ExperimentConfigs[StatsigExperiments.CHOOSE_YOUR_ADVENTURE]),
  }
}
