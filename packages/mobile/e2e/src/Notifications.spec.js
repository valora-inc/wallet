import RestoreAccountOnboarding from './usecases/RestoreAccountOnboarding'
import HandleNotification from './usecases/HandleNotification'

describe.skip('Handle app open from push notifications', () => {
  describe('Onboarding', RestoreAccountOnboarding)
  describe('HandleNotification', HandleNotification)
})
