import { StatsigDynamicConfigs, StatsigExperiments, StatsigParameter } from 'src/statsig/types'
import Logger from 'src/utils/Logger'
import { DynamicConfig, Statsig, StatsigUser } from 'statsig-react-native'
import { store } from 'src/redux/store'
import { walletAddressSelector } from 'src/web3/selectors'
import { startOnboardingTimeSelector } from 'src/account/selectors'
import * as _ from 'lodash'

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
    Logger.warn(
      'getExperimentParams',
      `Error getting params for experiment: ${experimentName}`,
      error
    )
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
    Logger.warn('getDynamicConfig', `Error getting params for dynamic config: ${configName}`, error)
    return defaultValues
  }
}

/**
 * Updates the current Statsig user. If no argument is given, a default StatsigUser
 * object is used to update the user, based on values from the redux store. If a StatsigUser
 * object is provided as a parameter, the provided object will be deep merged with the default
 * object from redux, with the provided object overriding fields in the default object.
 *
 * This function does not update default values in redux; callers are expected to update redux
 * state themselves.
 */
export async function patchUpdateStatsigUser(statsigUser?: StatsigUser) {
  const defaultUser = getDefaultStatsigUser()
  await Statsig.updateUser(_.merge(defaultUser, statsigUser))
}

export function getDefaultStatsigUser(): StatsigUser {
  const state = store.getState()
  return {
    userID: walletAddressSelector(state) ?? undefined,
    custom: {
      startOnboardingTime: startOnboardingTimeSelector(state),
    },
  }
}
