import { quickOnboarding } from './utils/utils'
import ExchangeCelo from './usecases/ExchangeCelo'

describe('Given Exchange', () => {
  beforeAll(async () => {
    await quickOnboarding()
  })

  describe('When CELO', ExchangeCelo)
})
