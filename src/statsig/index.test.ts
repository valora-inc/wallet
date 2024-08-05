import { LaunchArguments } from 'react-native-launch-arguments'
import { MultichainBetaStatus } from 'src/app/actions'
import { store } from 'src/redux/store'
import { DynamicConfigs, ExperimentConfigs } from 'src/statsig/constants'
import {
  getDynamicConfigParams,
  getExperimentParams,
  getFeatureGate,
  getMultichainFeatures,
  patchUpdateStatsigUser,
  setupOverridesFromLaunchArgs,
} from 'src/statsig/index'
import {
  StatsigDynamicConfigs,
  StatsigExperiments,
  StatsigFeatureGates,
  StatsigMultiNetworkDynamicConfig,
} from 'src/statsig/types'
import { NetworkId } from 'src/transactions/types'
import Logger from 'src/utils/Logger'
import { EvaluationReason } from 'statsig-js'
import { DynamicConfig, Statsig } from 'statsig-react-native'
import { getMockStoreData } from 'test/utils'

jest.mock('src/redux/store', () => ({ store: { getState: jest.fn() } }))
jest.mock('statsig-react-native')
jest.mock('src/utils/Logger')

const mockStore = jest.mocked(store)
const MOCK_ACCOUNT = '0x000000000000000000000000000000000000000000'
const MOCK_START_ONBOARDING_TIME = 1680563877
mockStore.getState.mockImplementation(() =>
  getMockStoreData({
    web3: { account: MOCK_ACCOUNT },
    account: { startOnboardingTime: MOCK_START_ONBOARDING_TIME },
  })
)

describe('Statsig helpers', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })
  describe('data validation', () => {
    it.each(Object.entries(ExperimentConfigs))(
      `ExperimentConfigs.%s has correct experimentName`,
      (key, { experimentName }) => {
        expect(key).toEqual(experimentName)
      }
    )
    it.each(Object.entries(DynamicConfigs))(
      `DynamicConfigs.%s has correct configName`,
      (key, { configName }) => {
        expect(key).toEqual(configName)
      }
    )
  })
  describe('getExperimentParams', () => {
    it('returns default values if getting statsig experiment throws error', () => {
      ;(Statsig.getExperiment as jest.Mock).mockImplementation(() => {
        throw new Error('mock error')
      })
      const defaultValues = { param1: 'defaultValue1', param2: 'defaultValue2' }
      const experimentName = 'mock_experiment_name' as StatsigExperiments
      const output = getExperimentParams({ experimentName, defaultValues })
      expect(Logger.warn).toHaveBeenCalled()
      expect(output).toEqual(defaultValues)
    })
    it('returns Statsig values if no error is thrown', () => {
      const getMock = jest.fn().mockImplementation((paramName: string, _defaultValue: string) => {
        if (paramName === 'param1') {
          return 'statsigValue1'
        } else if (paramName === 'param2') {
          return 'statsigValue2'
        } else {
          throw new Error('unexpected param name')
        }
      })
      ;(Statsig.getExperiment as jest.Mock).mockImplementation(() => ({
        get: getMock,
        getEvaluationDetails: () => ({ reason: EvaluationReason.Network }),
      }))
      const defaultValues = { param1: 'defaultValue1', param2: 'defaultValue2' }
      const experimentName = 'mock_experiment_name' as StatsigExperiments
      const output = getExperimentParams({ experimentName, defaultValues })
      expect(Logger.warn).not.toHaveBeenCalled()
      expect(Statsig.getExperiment).toHaveBeenCalledWith(experimentName)
      expect(getMock).toHaveBeenCalledWith('param1', 'defaultValue1')
      expect(getMock).toHaveBeenCalledWith('param2', 'defaultValue2')
      expect(output).toEqual({ param1: 'statsigValue1', param2: 'statsigValue2' })
    })
    it('returns values and logs error if sdk uninitialized', () => {
      const getMock = jest.fn().mockImplementation((paramName: string, _defaultValue: string) => {
        if (paramName === 'param1') {
          return 'statsigValue1'
        } else if (paramName === 'param2') {
          return 'statsigValue2'
        } else {
          throw new Error('unexpected param name')
        }
      })
      ;(Statsig.getExperiment as jest.Mock).mockImplementation(() => ({
        get: getMock,
        getEvaluationDetails: () => ({ reason: EvaluationReason.Uninitialized }),
      }))
      const defaultValues = { param1: 'defaultValue1', param2: 'defaultValue2' }
      const experimentName = 'mock_experiment_name' as StatsigExperiments
      const output = getExperimentParams({ experimentName, defaultValues })
      expect(Logger.warn).toHaveBeenCalled()
      expect(Statsig.getExperiment).toHaveBeenCalledWith(experimentName)
      expect(getMock).toHaveBeenCalledWith('param1', 'defaultValue1')
      expect(getMock).toHaveBeenCalledWith('param2', 'defaultValue2')
      expect(output).toEqual({ param1: 'statsigValue1', param2: 'statsigValue2' })
    })
  })

  describe('getFeatureGate', () => {
    it('returns false if getting statsig feature gate throws error', () => {
      jest.mocked(Statsig.checkGate).mockImplementation(() => {
        throw new Error('mock error')
      })
      const output = getFeatureGate(StatsigFeatureGates.APP_REVIEW)
      expect(Logger.warn).toHaveBeenCalled()
      expect(output).toEqual(false)
    })
    it('returns Statsig values if no error is thrown', () => {
      jest.mocked(Statsig.checkGate).mockImplementation(() => true)
      const output = getFeatureGate(StatsigFeatureGates.APP_REVIEW)
      expect(Logger.warn).not.toHaveBeenCalled()
      expect(output).toEqual(true)
    })
  })

  describe('getMultichainFeatures', () => {
    it('returns default values if getting statsig dynamic config throws error', () => {
      jest.mocked(Statsig.getConfig).mockImplementation(() => {
        throw new Error('mock error')
      })
      const defaultValues =
        DynamicConfigs[StatsigMultiNetworkDynamicConfig.MULTI_CHAIN_FEATURES].defaultValues
      const output = getMultichainFeatures()
      expect(Logger.warn).toHaveBeenCalled()
      expect(output).toEqual(defaultValues)
    })
    it('filters out invalid NetworkIds', () => {
      const defaultValues =
        DynamicConfigs[StatsigMultiNetworkDynamicConfig.MULTI_CHAIN_FEATURES].defaultValues
      const getMock = jest
        .fn()
        .mockImplementation((paramName: keyof typeof defaultValues, _defaultValue: string) => {
          if (paramName === 'showCico') {
            return [NetworkId['arbitrum-one'], NetworkId['base-mainnet']]
          } else if (paramName === 'showBalances') {
            // celo is not a valid network id
            return [NetworkId['ethereum-mainnet'], 'celo']
          } else {
            return DynamicConfigs[StatsigMultiNetworkDynamicConfig.MULTI_CHAIN_FEATURES]
              .defaultValues[paramName]
          }
        })
      jest.mocked(Statsig.getConfig).mockImplementation(
        () =>
          ({
            get: getMock,
            getEvaluationDetails: () => ({ reason: EvaluationReason.Network }),
          }) as unknown as DynamicConfig
      )
      const output = getMultichainFeatures()
      expect(Logger.warn).not.toHaveBeenCalled()
      expect(output).toEqual({
        ...DynamicConfigs[StatsigMultiNetworkDynamicConfig.MULTI_CHAIN_FEATURES].defaultValues,
        showCico: [NetworkId['arbitrum-one'], NetworkId['base-mainnet']],
        showBalances: [NetworkId['ethereum-mainnet']],
      })
      expect(Statsig.getConfig).toHaveBeenCalledWith(
        StatsigMultiNetworkDynamicConfig.MULTI_CHAIN_FEATURES
      )
    })
    it('returns values and logs error if sdk uninitialized', () => {
      const defaultValues =
        DynamicConfigs[StatsigMultiNetworkDynamicConfig.MULTI_CHAIN_FEATURES].defaultValues
      const getMock = jest
        .fn()
        .mockImplementation((paramName: keyof typeof defaultValues, _defaultValue: string) => {
          if (paramName === 'showCico') {
            return [NetworkId['arbitrum-one'], NetworkId['base-mainnet']]
          } else if (paramName === 'showBalances') {
            // celo is not a valid network id
            return [NetworkId['ethereum-mainnet'], 'celo']
          } else {
            return DynamicConfigs[StatsigMultiNetworkDynamicConfig.MULTI_CHAIN_FEATURES]
              .defaultValues[paramName]
          }
        })
      jest.mocked(Statsig.getConfig).mockImplementation(
        () =>
          ({
            get: getMock,
            getEvaluationDetails: () => ({ reason: EvaluationReason.Network }),
          }) as unknown as DynamicConfig
      )
      const output = getMultichainFeatures()
      expect(Logger.warn).not.toHaveBeenCalled()
      expect(output).toEqual({
        ...DynamicConfigs[StatsigMultiNetworkDynamicConfig.MULTI_CHAIN_FEATURES].defaultValues,
        showCico: [NetworkId['arbitrum-one'], NetworkId['base-mainnet']],
        showBalances: [NetworkId['ethereum-mainnet']],
      })
      expect(Statsig.getConfig).toHaveBeenCalledWith(
        StatsigMultiNetworkDynamicConfig.MULTI_CHAIN_FEATURES
      )
    })
  })

  describe('getDynamicConfigParams', () => {
    it('returns default values if getting statsig dynamic config throws error', () => {
      ;(Statsig.getConfig as jest.Mock).mockImplementation(() => {
        throw new Error('mock error')
      })
      const defaultValues = { param1: 'defaultValue1', param2: 'defaultValue2' }
      const configName = 'mock_config' as StatsigDynamicConfigs
      const output = getDynamicConfigParams({ configName, defaultValues })
      expect(Logger.warn).toHaveBeenCalled()
      expect(output).toEqual(defaultValues)
    })
    it('returns Statsig values if no error is thrown', () => {
      const getMock = jest.fn().mockImplementation((paramName: string, _defaultValue: string) => {
        if (paramName === 'param1') {
          return 'statsigValue1'
        } else if (paramName === 'param2') {
          return 'statsigValue2'
        } else {
          throw new Error('unexpected param name')
        }
      })
      ;(Statsig.getConfig as jest.Mock).mockImplementation(() => ({
        get: getMock,
        getEvaluationDetails: () => ({ reason: EvaluationReason.Network }),
      }))
      const defaultValues = { param1: 'defaultValue1', param2: 'defaultValue2' }
      const configName = 'mock_config' as StatsigDynamicConfigs
      const output = getDynamicConfigParams({ configName, defaultValues })
      expect(Logger.warn).not.toHaveBeenCalled()
      expect(Statsig.getConfig).toHaveBeenCalledWith(configName)
      expect(getMock).toHaveBeenCalledWith('param1', 'defaultValue1')
      expect(getMock).toHaveBeenCalledWith('param2', 'defaultValue2')
      expect(output).toEqual({ param1: 'statsigValue1', param2: 'statsigValue2' })
    })
    it('returns values and logs error if sdk uninitialized', () => {
      const getMock = jest.fn().mockImplementation((paramName: string, _defaultValue: string) => {
        if (paramName === 'param1') {
          return 'statsigValue1'
        } else if (paramName === 'param2') {
          return 'statsigValue2'
        } else {
          throw new Error('unexpected param name')
        }
      })
      ;(Statsig.getConfig as jest.Mock).mockImplementation(() => ({
        get: getMock,
        getEvaluationDetails: () => ({ reason: EvaluationReason.Uninitialized }),
      }))
      const defaultValues = { param1: 'defaultValue1', param2: 'defaultValue2' }
      const configName = 'mock_config' as StatsigDynamicConfigs
      const output = getDynamicConfigParams({ configName, defaultValues })
      expect(Logger.warn).toHaveBeenCalled()
      expect(Statsig.getConfig).toHaveBeenCalledWith(configName)
      expect(getMock).toHaveBeenCalledWith('param1', 'defaultValue1')
      expect(getMock).toHaveBeenCalledWith('param2', 'defaultValue2')
      expect(output).toEqual({ param1: 'statsigValue1', param2: 'statsigValue2' })
    })
  })
  describe('patchUpdateStatsigUser', () => {
    let mockDateNow: jest.SpyInstance

    beforeEach(() => {
      mockDateNow = jest.spyOn(Date, 'now').mockReturnValue(1234)
    })

    afterEach(() => {
      mockDateNow.mockReset()
    })

    it('logs an error if statsig throws', async () => {
      jest.mocked(Statsig.updateUser).mockRejectedValue(new Error())
      await patchUpdateStatsigUser()
      expect(Statsig.updateUser).toHaveBeenCalledTimes(1)
      expect(Statsig.updateUser).toHaveBeenCalledWith({
        userID: MOCK_ACCOUNT.toLowerCase(),
        custom: {
          startOnboardingTime: MOCK_START_ONBOARDING_TIME,
          multichainBetaStatus: MultichainBetaStatus.NotSeen,
          loadTime: 1234,
        },
      })
      expect(Logger.error).toHaveBeenCalledTimes(1)
    })
    it('uses default values when passed no parameters', async () => {
      await patchUpdateStatsigUser()
      expect(Statsig.updateUser).toHaveBeenCalledTimes(1)
      expect(Statsig.updateUser).toHaveBeenCalledWith({
        userID: MOCK_ACCOUNT.toLowerCase(),
        custom: {
          startOnboardingTime: MOCK_START_ONBOARDING_TIME,
          multichainBetaStatus: MultichainBetaStatus.NotSeen,
          loadTime: 1234,
        },
      })
    })
    it('overrides custom fields when passed', async () => {
      const statsigUser = {
        custom: {
          startOnboardingTime: 1680563880,
          multichainBetaStatus: MultichainBetaStatus.OptedIn,
          otherCustomProperty: 'foo',
          loadTime: 12345,
        },
      }
      await patchUpdateStatsigUser(statsigUser)
      expect(Statsig.updateUser).toHaveBeenCalledTimes(1)
      expect(Statsig.updateUser).toHaveBeenCalledWith({
        userID: MOCK_ACCOUNT.toLowerCase(),
        custom: statsigUser.custom,
      })
    })
    it('overrides user ID when passed', async () => {
      const statsigUser = {
        userID: 'some address',
        custom: {
          startOnboardingTime: 1680563880,
          multichainBetaStatus: MultichainBetaStatus.OptedIn,
          otherCustomProperty: 'foo',
          loadTime: 12345,
        },
      }
      await patchUpdateStatsigUser(statsigUser)
      expect(Statsig.updateUser).toHaveBeenCalledTimes(1)
      expect(Statsig.updateUser).toHaveBeenCalledWith(statsigUser)
    })
    it('uses custom and default fields', async () => {
      const statsigUser = {
        custom: {
          otherCustomProperty1: 'foo',
          otherCustomProperty2: 'bar',
        },
      }
      await patchUpdateStatsigUser(statsigUser)
      expect(Statsig.updateUser).toHaveBeenCalledTimes(1)
      expect(Statsig.updateUser).toHaveBeenCalledWith({
        userID: MOCK_ACCOUNT.toLowerCase(),
        custom: {
          startOnboardingTime: MOCK_START_ONBOARDING_TIME,
          multichainBetaStatus: MultichainBetaStatus.NotSeen,
          ...statsigUser.custom,
          loadTime: 1234,
        },
      })
    })
  })

  describe('setupOverridesFromLaunchArgs', () => {
    it('cleans up overrides and skips setup if no override is set', () => {
      jest.mocked(LaunchArguments.value).mockReturnValue({})
      setupOverridesFromLaunchArgs()
      expect(Statsig.removeGateOverride).toHaveBeenCalledWith()
      expect(Statsig.overrideGate).not.toHaveBeenCalled()
    })

    it('cleans up and sets up gate overrides if set', () => {
      jest
        .mocked(LaunchArguments.value)
        .mockReturnValue({ statsigGateOverrides: 'gate1=true,gate2=false' })
      setupOverridesFromLaunchArgs()
      expect(Statsig.removeGateOverride).toHaveBeenCalledWith()
      expect(Statsig.overrideGate).toHaveBeenCalledTimes(2)
      expect(Statsig.overrideGate).toHaveBeenCalledWith('gate1', true)
      expect(Statsig.overrideGate).toHaveBeenCalledWith('gate2', false)
    })
  })
})
