import { Statsig } from 'statsig-react-native'
import { getExperimentParams } from 'src/statsig/index'
import { StatsigExperiments } from 'src/statsig/types'
import Logger from 'src/utils/Logger'
import { ExperimentConfigs } from 'src/statsig/constants'

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
  })
  describe('getExperimentParams', () => {
    it('returns default values if getting statsig experiment throws error', () => {
      ;(Statsig.getExperiment as jest.Mock).mockImplementation(() => {
        throw new Error('mock error')
      })
      const defaultValues = { param1: 'defaultValue1', param2: 'defaultValue2' }
      const experimentName = StatsigExperiments.RECOVERY_PHRASE_IN_ONBOARDING // chosen arbitrarily
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
      const experimentName = StatsigExperiments.RECOVERY_PHRASE_IN_ONBOARDING // chosen arbitrarily
      const output = getExperimentParams({ experimentName, defaultValues })
      expect(Logger.warn).not.toHaveBeenCalled()
      expect(getMock).toHaveBeenCalledWith('param1', 'defaultValue1')
      expect(getMock).toHaveBeenCalledWith('param2', 'defaultValue2')
      expect(output).toEqual({ param1: 'statsigValue1', param2: 'statsigValue2' })
    })
  })
})
