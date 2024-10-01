import HandleNotification from './usecases/HandleNotification'
import { quickOnboarding } from './utils/utils'

describe('Handle app open from push notifications', () => {
  beforeAll(async () => {
    await quickOnboarding()
  })

  describe('HandleNotification', HandleNotification)
})
