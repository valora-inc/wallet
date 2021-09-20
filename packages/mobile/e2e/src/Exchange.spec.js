import { quickOnboarding } from './utils/utils'
import ExchangeCelo from './usecases/ExchangeCelo'

describe('Exchange', () => {
  beforeAll(async () => {
    await quickOnboarding()
  })

  describe('CELO', ExchangeCelo)
})
