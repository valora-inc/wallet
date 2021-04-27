import dismissBanners from './utils/banners'
import RestoreAccountOnboarding from './usecases/RestoreAccountOnboarding'
import WalletConnect from './usecases/WalletConnect'

describe.skip('WalletConnect', () => {
  beforeAll(async () => {
    await device.launchApp({
      permissions: { camera: 'YES' },
    })
  })

  beforeEach(dismissBanners)

  describe('Onboarding', RestoreAccountOnboarding)
  describe('SignTransaction', WalletConnect)
})
