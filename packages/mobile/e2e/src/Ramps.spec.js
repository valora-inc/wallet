import { quickOnboarding } from './utils/utils'
import CashIn from './usecases/CashIn'

describe('Ramps', () => {
  beforeAll(async () => {
    await device.launchApp({
      permissions: { notifications: 'YES', contacts: 'YES' },
    })
    await quickOnboarding()
  })

  describe('Cash In', CashIn)
})
