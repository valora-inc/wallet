import * as _ from 'lodash'
import { LaunchArguments } from 'react-native-launch-arguments'
import { startOnboardingTimeSelector } from 'src/account/selectors'
import { ExpectedLaunchArgs, STATSIG_ENABLED } from 'src/config'
import { DynamicConfigs } from 'src/statsig/constants'
import {
  StatsigDynamicConfigs,
  StatsigExperiments,
  StatsigFeatureGates,
  StatsigMultiNetworkDynamicConfig,
  StatsigParameter,
} from 'src/statsig/types'
import { NetworkId } from 'src/transactions/types'
import Logger from 'src/utils/Logger'
import { walletAddressSelector } from 'src/web3/selectors'
import { EvaluationReason } from 'statsig-js'
import { DynamicConfig, Statsig, StatsigUser } from 'statsig-react-native'

const TAG = 'Statsig'

let gateOverrides: { [key: string]: boolean } = {}

// Only for testing
export function _getGateOverrides() {
  return gateOverrides
}

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
    if (!STATSIG_ENABLED) {
      return defaultValues
    }
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

function _getDynamicConfigParams<T extends Record<string, StatsigParameter>>({
  configName,
  defaultValues,
}: {
  configName: StatsigDynamicConfigs | StatsigMultiNetworkDynamicConfig
  defaultValues: T
}): T {
  try {
    if (!STATSIG_ENABLED) {
      return defaultValues
    }
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

export function getMultichainFeatures() {
  const multichainParams = _getDynamicConfigParams(
    DynamicConfigs[StatsigMultiNetworkDynamicConfig.MULTI_CHAIN_FEATURES]
  )
  const filteredParams = {} as { [key: string]: NetworkId[] }
  Object.entries(multichainParams).forEach(([key, value]) => {
    filteredParams[key] = value.filter((networkId) => networkId in NetworkId)
  })
  return filteredParams
}

// Cannot be used to retrieve dynamic config for multichain features
export function getDynamicConfigParams<T extends Record<string, StatsigParameter>>({
  configName,
  defaultValues,
}: {
  configName: StatsigDynamicConfigs
  defaultValues: T
}): T {
  return _getDynamicConfigParams({ configName, defaultValues })
}

export function getFeatureGate(featureGateName: StatsigFeatureGates) {
  // gates should always default to false, this boolean is to just remain backwards compatible
  // with gates defaulting to true
  const defaultGateValue = featureGateName === StatsigFeatureGates.ALLOW_HOOKS_PREVIEW
  try {
    if (featureGateName in gateOverrides) {
      return gateOverrides[featureGateName]
    }

    if (!STATSIG_ENABLED) {
      return defaultGateValue
    }
    return Statsig.checkGate(featureGateName)
  } catch (error) {
    Logger.warn(TAG, `Error getting feature gate: ${featureGateName}`, error)
    return defaultGateValue
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
    if (!STATSIG_ENABLED) {
      return
    }
    const defaultUser = getDefaultStatsigUser()
    await Statsig.updateUser(_.merge(defaultUser, statsigUser))
  } catch (error) {
    Logger.error(TAG, 'Failed to update Statsig user', error)
  }
}

export function setupOverridesFromLaunchArgs() {
  try {
    Logger.debug(TAG, 'Cleaning up local overrides')
    const newGateOverrides: typeof gateOverrides = {}
    const { statsigGateOverrides } = LaunchArguments.value<ExpectedLaunchArgs>()
    if (statsigGateOverrides) {
      Logger.debug(TAG, 'Setting up gate overrides', statsigGateOverrides)
      statsigGateOverrides.split(',').forEach((gateOverride: string) => {
        const [gate, value] = gateOverride.split('=')
        newGateOverrides[gate] = value === 'true'
      })
    }
    gateOverrides = newGateOverrides
  } catch (err) {
    Logger.debug(TAG, 'Overrides setup failed', err)
  }
}
