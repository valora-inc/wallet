import ExchangeCelo from './usecases/ExchangeCelo'
import { quickOnboarding } from './utils/utils'

describe('Given Exchange', () => {
  beforeAll(async () => {
    await quickOnboarding()
  })

  describe('When CELO', ExchangeCelo)
})
