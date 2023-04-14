import CeloEducation from './usecases/CeloEducation'
import PriceChart from './usecases/PriceChart'
import CeloNews from './usecases/CeloNews'
import { quickOnboarding, waitForElementByIdAndTap } from './utils/utils'
import { celoEducation } from './utils/celoEducation'

describe('Celo page', () => {
  beforeAll(async () => {
    await quickOnboarding()
    await waitForElementByIdAndTap('Hamburger')
    await waitForElementByIdAndTap('CELO')
    await celoEducation()
  })

  describe('celo education', CeloEducation)
  describe('price chart', PriceChart)
  describe('celo news', CeloNews)
})
