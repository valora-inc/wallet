import dismissBanners from './utils/banners'
import RestoreAccountOnboarding from './usecases/RestoreAccountOnboarding'
import WalletConnect from './usecases/WalletConnect'

describe('WalletConnect', () => {
  beforeAll(async () => {
    await device.launchApp({
      permissions: { camera: 'YES' },
    })
  })

  beforeEach(dismissBanners)
  // describe('Onboarding', RestoreAccountOnboarding)
  describe('SignTransaction', WalletConnect)
})
