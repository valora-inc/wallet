import { quickOnboarding } from './utils/utils'
import RestoreAccountOnboarding from './usecases/RestoreAccountOnboarding'
import Send from './usecases/Send'
import SecureSend from './usecases/SecureSend'

describe('Send CELO', () => {
  beforeAll(async () => {
    await device.launchApp({
      permissions: { notifications: 'YES', contacts: 'YES' },
    })
    await quickOnboarding()
  })

  describe('Send CELO', Send)
  describe('SecureSend CELO', SecureSend)
})
