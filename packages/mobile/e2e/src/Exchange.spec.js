import { quickOnboarding } from './utils/utils'
import ExchangeCelo from './usecases/ExchangeCelo'

describe('Exchange', () => {
  beforeAll(async () => {
    await device.launchApp({
      permissions: { notifications: 'YES', contacts: 'YES' },
    })
    await quickOnboarding()
  })

  describe('Exchange CELO', ExchangeCelo)
})
