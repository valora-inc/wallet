import CeloEducation from './usecases/CeloEducation'
import CeloNews from './usecases/CeloNews'
import PriceChart from './usecases/PriceChart'
import { quickOnboarding } from './utils/utils'

describe('Celo page', () => {
  beforeAll(async () => {
    await quickOnboarding()
  })

  describe('celo education', CeloEducation)
})
