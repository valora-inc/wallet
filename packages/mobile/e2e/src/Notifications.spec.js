import HandleNotification from './usecases/HandleNotification'

describe.skip('Handle app open from push notifications', () => {
  beforeAll(async () => {
    await device.launchApp({
      permissions: { notifications: 'YES', contacts: 'YES' },
    })
    await quickOnboarding()
  })
  describe('HandleNotification', HandleNotification)
})
