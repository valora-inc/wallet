import RestoreAccountOnboarding from './usecases/RestoreAccountOnboarding'
import ResetAccount from './usecases/ResetAccount'
import Support from './usecases/Support'

describe('Account Support', () => {
  beforeAll(async () => {
    await device.launchApp({
      permissions: { notifications: 'YES', contacts: 'YES' },
    })
    await device.reloadReactNative()
  })

  describe('Onboarding', RestoreAccountOnboarding)
  describe('Support', Support)
  describe('Reset Account', ResetAccount)
})
