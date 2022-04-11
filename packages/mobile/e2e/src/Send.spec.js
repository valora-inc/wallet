import SecureSend from './usecases/SecureSend'
import Send from './usecases/Send'
import { quickOnboarding } from './utils/utils'

describe('Send cUSD', () => {
  beforeAll(async () => {
    await quickOnboarding()
  })

  describe('Send cUSD', Send)
  describe('SecureSend cUSD', SecureSend)
})
