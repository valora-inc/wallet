import CeloEducation from './usecases/CeloEducation'
import CeloNews from './usecases/CeloNews'
import PriceChart from './usecases/PriceChart'
import { quickOnboarding } from './utils/utils'

describe.skip('Celo page', () => {
  beforeAll(async () => {
    await quickOnboarding()
  })

  describe('celo education', CeloEducation)
  describe('price chart', PriceChart)
  describe('celo news', CeloNews)
})
