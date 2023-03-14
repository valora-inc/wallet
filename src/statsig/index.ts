import { ExperimentConfig, StatsigExperiments, StatsigParameter } from 'src/statsig/types'
import Logger from 'src/utils/Logger'
import { Statsig } from 'statsig-react-native'

export function getExperimentParams<T extends Record<string, StatsigParameter>>(
  experimentName: StatsigExperiments,
  defaultValuesForExperiment: T
): T {
  try {
    const experiment = Statsig.getExperiment(experimentName)
    type Parameter = keyof T
    const output = {} as T
    for (const key of Object.keys(defaultValuesForExperiment) as Parameter[]) {
      output[key] = experiment.get(key as string, defaultValuesForExperiment[key])
    }
    return output
  } catch (error) {
    Logger.warn('getExperimentParams', `Error getting experiment params`, error)
    return defaultValuesForExperiment
  }
}

export function getExperimentParamsFromConfig<T extends Record<string, StatsigParameter>>({
  experimentName,
  defaultValues,
}: ExperimentConfig<T>) {
  return getExperimentParams(experimentName, defaultValues)
}
