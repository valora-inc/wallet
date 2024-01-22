import * as _ from 'lodash'
import { LaunchArguments } from 'react-native-launch-arguments'
import { startOnboardingTimeSelector } from 'src/account/selectors'
import { multichainBetaStatusSelector } from 'src/app/selectors'
import { FeatureGates } from 'src/statsig/constants'
import {
  StatsigDynamicConfigs,
  StatsigExperiments,
  StatsigFeatureGates,
  StatsigParameter,
} from 'src/statsig/types'
import Logger from 'src/utils/Logger'
import { walletAddressSelector } from 'src/web3/selectors'
import { EvaluationReason } from 'statsig-js'
import { DynamicConfig, Statsig, StatsigUser } from 'statsig-react-native'

const TAG = 'Statsig'

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
    DefaultValue,
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
    if (experiment.getEvaluationDetails().reason === EvaluationReason.Uninitialized) {
      Logger.warn(
        TAG,
        'getExperimentParams: SDK is uninitialized when getting experiment',
        experiment
      )
    }
    return getParams({ config: experiment, defaultValues })
  } catch (error) {
    Logger.warn(
      TAG,
      `getExperimentParams: Error getting params for experiment: ${experimentName}`,
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
    if (config.getEvaluationDetails().reason === EvaluationReason.Uninitialized) {
      Logger.warn(
        TAG,
        'getDynamicConfigParams: SDK is uninitialized when getting experiment',
        config
      )
    }
    return getParams({ config, defaultValues })
  } catch (error) {
    Logger.warn(TAG, `Error getting params for dynamic config: ${configName}`, error)
    return defaultValues
  }
}

export function getFeatureGate(featureGateName: StatsigFeatureGates) {
  try {
    return Statsig.checkGate(featureGateName)
  } catch (error) {
    Logger.warn(TAG, `Error getting feature gate: ${featureGateName}`, error)
    return FeatureGates[featureGateName]
  }
}

export function getDefaultStatsigUser(): StatsigUser {
  // Inlined to avoid require cycles
  // like src/statsig/index.ts -> src/redux/store.ts -> src/redux/sagas.ts -> src/positions/saga.ts -> src/statsig/index.ts
  // and similar
  const { store } = require('src/redux/store')
  const state = store.getState()
  return {
    userID: walletAddressSelector(state) ?? undefined,
    custom: {
      startOnboardingTime: startOnboardingTimeSelector(state),
      multichainBetaStatus: multichainBetaStatusSelector(state),
      loadTime: Date.now(),
    },
  }
}

/**
 * Updates the current Statsig user. If no argument is given, a default StatsigUser
 * object is used to update the user, based on values from the redux store. If a StatsigUser
 * object is provided as a parameter, the provided object will be deep merged with the default
 * object from redux, with the provided object overriding fields in the default
 * object. The default object also includes a `loadTime` field which is set to
 * current time, so calling this method with no args will always force a refresh
 * since `loadTime` will change.
 *
 * If the update fails for whatever reason, an error will be logged.
 *
 * This function does not update default values in redux; callers are expected to update redux
 * state themselves.
 */
export async function patchUpdateStatsigUser(statsigUser?: StatsigUser) {
  try {
    const defaultUser = getDefaultStatsigUser()
    await Statsig.updateUser(_.merge(defaultUser, statsigUser))
  } catch (error) {
    Logger.error(TAG, 'Failed to update Statsig user', error)
  }
}

interface ExpectedLaunchArgs {
  statsigGateOverrides?: string // format: gate_1=true,gate_2=false
}

export function setupOverridesFromLaunchArgs() {
  try {
    Logger.debug(TAG, 'Cleaning up local overrides')
    Statsig.removeGateOverride() // remove all gate overrides
    const { statsigGateOverrides } = LaunchArguments.value<ExpectedLaunchArgs>()
    if (statsigGateOverrides) {
      Logger.debug(TAG, 'Setting up gate overrides', statsigGateOverrides)
      statsigGateOverrides.split(',').forEach((gateOverride: string) => {
        const [gate, value] = gateOverride.split('=')
        Statsig.overrideGate(gate, value === 'true')
      })
    }
  } catch (err) {
    Logger.debug(TAG, 'Overrides setup failed', err)
  }
}
