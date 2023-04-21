import { store } from 'src/redux/store'
import { DynamicConfigs, ExperimentConfigs } from 'src/statsig/constants'
import {
  getDynamicConfigParams,
  getExperimentParams,
  initializeStatsig,
  patchUpdateStatsigUser,
} from 'src/statsig/index'
import { StatsigDynamicConfigs, StatsigExperiments } from 'src/statsig/types'
import Logger from 'src/utils/Logger'
import { EvaluationReason } from 'statsig-js'
import { Statsig } from 'statsig-react-native'
import { getMockStoreData } from 'test/utils'
import { mocked } from 'ts-jest/utils'

jest.unmock('src/statsig/index')
jest.mock('src/redux/store', () => ({ store: { getState: jest.fn() } }))
jest.mock('statsig-react-native')
jest.mock('src/utils/Logger')
jest.mock('@segment/analytics-react-native', () => ({
  __esModule: true,
  default: {
    getAnonymousId: jest.fn().mockResolvedValue('anonId'),
  },
}))
jest.mock('src/config', () => ({
  ...(jest.requireActual('src/config') as any),
  STATSIG_API_KEY: 'statsig-key',
}))

const mockStore = mocked(store)
const MOCK_ACCOUNT = '0x000000000000000000000000000000000000000000'
const MOCK_START_ONBOARDING_TIME = 1680563877
mockStore.getState.mockImplementation(() =>
  getMockStoreData({
    web3: { account: MOCK_ACCOUNT, mtwAddress: '0x0000' },
    account: { startOnboardingTime: MOCK_START_ONBOARDING_TIME },
  })
)

describe('Statsig helpers', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })
  describe('initialization', () => {
    it('creates statsig client on initialization with wallet address as user id', async () => {
      await initializeStatsig()

      expect(Statsig.initialize).toHaveBeenCalledWith(
        'statsig-key',
        { userID: MOCK_ACCOUNT, custom: { startOnboardingTime: MOCK_START_ONBOARDING_TIME } },
        { environment: { tier: 'development' }, overrideStableID: 'anonId', localMode: false }
      )
    })

    it('creates statsig client on initialization with null as user id if wallet address is not set', async () => {
      mockStore.getState.mockImplementationOnce(() =>
        getMockStoreData({
          web3: { account: undefined },
          account: { startOnboardingTime: MOCK_START_ONBOARDING_TIME },
        })
      )
      await initializeStatsig()

      expect(Statsig.initialize).toHaveBeenCalledWith(
        'statsig-key',
        {
          userID: undefined,
          custom: {
            startOnboardingTime: MOCK_START_ONBOARDING_TIME,
          },
        },
        {
          environment: { tier: 'development' },
          overrideStableID: 'anonId',
          localMode: false,
        }
      )
    })
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
    it('logs an error if statsig throws', async () => {
      mocked(Statsig.updateUser).mockRejectedValue(new Error())
      await patchUpdateStatsigUser()
      expect(Statsig.updateUser).toHaveBeenCalledTimes(1)
      expect(Statsig.updateUser).toHaveBeenCalledWith({
        userID: MOCK_ACCOUNT.toLowerCase(),
        custom: {
          startOnboardingTime: MOCK_START_ONBOARDING_TIME,
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
        },
      })
    })
    it('overrides custom fields when passed', async () => {
      const statsigUser = {
        custom: {
          startOnboardingTime: 1680563880,
          otherCustomProperty: 'foo',
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
          otherCustomProperty: 'foo',
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
          ...statsigUser.custom,
        },
      })
    })
  })
})
