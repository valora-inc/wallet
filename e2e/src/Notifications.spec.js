import HandleNotification from './usecases/HandleNotification'

describe.skip('Handle app open from push notifications', () => {
  beforeAll(async () => {
    await quickOnboarding()
  })
  describe('HandleNotification', HandleNotification)
})
