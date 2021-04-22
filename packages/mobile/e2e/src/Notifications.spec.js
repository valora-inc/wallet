import dismissBanners from './utils/banners'
import RestoreAccountOnboarding from './usecases/RestoreAccountOnboarding'
import HandleNotification from './usecases/HandleNotification'

describe.skip('Handle app open from push notifications', () => {
  beforeEach(dismissBanners)
  describe('Onboarding', RestoreAccountOnboarding)
  describe('HandleNotification', HandleNotification)
})
