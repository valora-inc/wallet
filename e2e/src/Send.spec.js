import SecureSend from './usecases/SecureSend'
import Send from './usecases/Send'
import { quickOnboarding } from './utils/utils'

describe('Given', () => {
  beforeAll(async () => {
    await quickOnboarding()
  })

  describe('Send', Send)
  describe('SecureSend cUSD', SecureSend)
})
