import { quickOnboarding } from './utils/utils'
import Send from './usecases/Send'
import SecureSend from './usecases/SecureSend'

describe('Send CELO', () => {
  beforeAll(async () => {
    await quickOnboarding()
  })

  describe('Send CELO #BVT', Send)
  describe('SecureSend CELO #BVT', SecureSend)
})
