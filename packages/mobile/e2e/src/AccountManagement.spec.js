import { quickOnboarding } from './utils/utils'
import ResetAccount from './usecases/ResetAccount'
import Support from './usecases/Support'
import Settings from './usecases/Settings'

describe('Account', () => {
  beforeAll(async () => {
    await quickOnboarding()
  })

  describe('Support', Support)
  describe('Settings', Settings)
  describe('Reset Account', ResetAccount)
})
