import dismissBanners from './utils/banners'
import RestoreAccountOnboarding from './usecases/RestoreAccountOnboarding'
import Send from './usecases/Send'
import SecureSend from './usecases/SecureSend'
import ExchangeCelo from './usecases/ExchangeCelo'
import ResetAccount from './usecases/ResetAccount'
import Support from './usecases/Support'

describe('Funded Account', () => {
  beforeAll(async () => {
    await device.launchApp({
      permissions: { notifications: 'YES', contacts: 'YES' },
    })
  })

  // beforeEach(dismissBanners) // Moved to individual specs

  describe('Onboarding', RestoreAccountOnboarding)
  describe('Support', Support)
  describe('Send cUSD', Send)
  describe('Secure Send', SecureSend)
  describe('Exchange CELO', ExchangeCelo)
  describe('Reset Account', ResetAccount)
})
