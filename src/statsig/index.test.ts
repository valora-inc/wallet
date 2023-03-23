import { DynamicConfigs, ExperimentConfigs } from 'src/statsig/constants'
import { getDynamicConfigParams, getExperimentParams, getFeatureGate } from 'src/statsig/index'
import { StatsigDynamicConfigs, StatsigExperiments, StatsigFeatureGates } from 'src/statsig/types'
import Logger from 'src/utils/Logger'
import { Statsig } from 'statsig-react-native'

jest.mock('statsig-react-native')
jest.mock('src/utils/Logger')

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
  })
  describe('getFeatureGate', () => {
    it('returns false if getting statsig feature gate throws error', () => {
      ;(Statsig.checkGate as jest.Mock).mockImplementation(() => {
        throw new Error('mock error')
      })
      const featureName = StatsigFeatureGates.SHOULD_SHOW_BITMAMA_WIDGET
      const output = getFeatureGate(featureName)
      expect(Logger.warn).toHaveBeenCalled()
      expect(output).toEqual(false)
    })
    it('returns Statsig value if no error is thrown', () => {
      ;(Statsig.checkGate as jest.Mock).mockImplementation(() => true)
      const featureName = StatsigFeatureGates.SHOULD_SHOW_BITMAMA_WIDGET
      const output = getFeatureGate(featureName)
      expect(Logger.warn).not.toHaveBeenCalled()
      expect(Statsig.checkGate).toHaveBeenCalledWith(featureName)
      expect(output).toEqual(true)
    })
  })
})
