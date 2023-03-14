import { StatsigExperiments, StatsigParameter } from 'src/statsig/types'
import Logger from 'src/utils/Logger'
import { Statsig } from 'statsig-react-native'

export function getExperimentParams<T extends Record<string, StatsigParameter>>(
  experimentName: StatsigExperiments,
  defaultValuesForExperiment: T
): T {
  try {
    const experiment = Statsig.getExperiment(experimentName)
    type Parameter = keyof T
    return (Object.keys(defaultValuesForExperiment) as Parameter[]).reduce(
      (acc: T, key: Parameter) => {
        acc[key as keyof T] = experiment.get(key as string, defaultValuesForExperiment[key])
        return acc
      },
      {} as T
    )
  } catch (error) {
    Logger.warn('getExperimentParams', `Error getting experiment params`, error)
    return defaultValuesForExperiment
  }
}
