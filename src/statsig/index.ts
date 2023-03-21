import { StatsigDynamicConfigs, StatsigExperiments, StatsigParameter } from 'src/statsig/types'
import Logger from 'src/utils/Logger'
import { DynamicConfig, Statsig } from 'statsig-react-native'

function getParams<T extends Record<string, StatsigParameter>>({
  config,
  defaultValues,
}: {
  config: DynamicConfig
  defaultValues: T
}) {
  type Parameter = keyof T
  type DefaultValue = T[Parameter]
  const output = {} as T
  for (const [param, defaultValue] of Object.entries(defaultValues) as [
    Parameter,
    DefaultValue
  ][]) {
    output[param] = config.get(param as string, defaultValue)
  }
  return output
}

export function getExperimentParams<T extends Record<string, StatsigParameter>>({
  experimentName,
  defaultValues,
}: {
  experimentName: StatsigExperiments
  defaultValues: T
}): T {
  try {
    const experiment = Statsig.getExperiment(experimentName)
    return getParams({ config: experiment, defaultValues })
  } catch (error) {
    Logger.warn('getExperimentParams', `Error getting experiment params`, error)
    return defaultValues
  }
}

export function getDynamicConfigParams<T extends Record<string, StatsigParameter>>({
  configName,
  defaultValues,
}: {
  configName: StatsigDynamicConfigs
  defaultValues: T
}): T {
  try {
    const config = Statsig.getConfig(configName)
    return getParams({ config, defaultValues })
  } catch (error) {
    Logger.warn('getDynamicConfig', `Error getting experiment params`, error)
    return defaultValues
  }
}
