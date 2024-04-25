import CeloEducation from './usecases/CeloEducation'
import PriceChart from './usecases/PriceChart'
import CeloNews from './usecases/CeloNews'
import { quickOnboarding } from './utils/utils'
import { launchApp } from './utils/retries'

describe('Celo page', () => {
  beforeAll(async () => {
    // TODO(ACT-1133): remove launchApp once drawer nav is removed
    await launchApp({
      newInstance: true,
      launchArgs: { statsigGateOverrides: 'use_tab_navigator=true' },
    })
    await quickOnboarding()
  })

  describe('celo education', CeloEducation)
  describe('price chart', PriceChart)
  describe('celo news', CeloNews)
})
