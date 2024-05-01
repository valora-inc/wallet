import CeloEducation from './usecases/CeloEducation'
import PriceChart from './usecases/PriceChart'
import CeloNews from './usecases/CeloNews'
import { quickOnboarding } from './utils/utils'
import { launchApp } from './utils/retries'

describe('Celo page', () => {
  beforeAll(async () => {
    await quickOnboarding()
  })

  describe('celo education', CeloEducation)
  describe('price chart', PriceChart)
  describe('celo news', CeloNews)
})
