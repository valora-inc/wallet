import { StatsigExperiments, StatsigParameter } from 'src/statsig/types'
import Logger from 'src/utils/Logger'
import { useExperiment } from 'statsig-react-native'

const TAG = 'Statsig/hooks'

export function useExperimentParams<T extends Record<string, StatsigParameter>>({
  experimentName,
  defaultValues,
}: {
  experimentName: StatsigExperiments
  defaultValues: T
}): T {
  const { config: experiment, isLoading } = useExperiment(experimentName)
  Logger.debug(TAG, `useExperimentParams: loading: ${isLoading}, expresult`, experiment)
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
}
