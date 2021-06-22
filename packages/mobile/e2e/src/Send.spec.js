import { quickOnboarding } from './utils/utils'
import Send from './usecases/Send'
import SecureSend from './usecases/SecureSend'

describe('Send cUSD', () => {
  beforeAll(async () => {
    await quickOnboarding()
  })

  describe('Send cUSD', Send)
  describe('SecureSend cUSD', SecureSend)
})
