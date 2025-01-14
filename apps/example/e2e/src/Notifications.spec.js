import HandleNotification from './usecases/HandleNotification'
import { quickOnboarding } from './utils/utils'

// TODO: re-enable once we add back CleverTap, since it's required for this test
describe.skip('Handle app open from push notifications', () => {
  beforeAll(async () => {
    await quickOnboarding()
  })

  describe('HandleNotification', HandleNotification)
})
