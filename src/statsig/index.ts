import { StatsigExperiments, StatsigParameter } from 'src/statsig/types'
import Logger from 'src/utils/Logger'
import { Statsig } from 'statsig-react-native'

export function getExperimentParams<T extends Record<string, StatsigParameter>>({
  experimentName,
  defaultValues,
}: {
  experimentName: StatsigExperiments
  defaultValues: T
}): T {
  try {
    const experiment = Statsig.getExperiment(experimentName)
    type Parameter = keyof T
    type DefaultValue = T[Parameter]
    const output = {} as T
    for (const [param, defaultValue] of Object.entries(defaultValues) as [
      Parameter,
      DefaultValue
    ][]) {
      output[param] = experiment.get(param as string, defaultValue)
    }
    return output
  } catch (error) {
    Logger.warn('getExperimentParams', `Error getting experiment params`, error)
    return defaultValues
  }
}
