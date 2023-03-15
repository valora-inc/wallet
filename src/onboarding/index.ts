import { ExperimentConfigs } from 'src/statsig/constants'
import { StatsigExperiments } from 'src/statsig/types'
import { getExperimentParams } from 'src/statsig'

export function getOnboardingExperimentParams() {
  return getExperimentParams(ExperimentConfigs[StatsigExperiments.RECOVERY_PHRASE_IN_ONBOARDING])
}
