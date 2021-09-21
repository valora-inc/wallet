import { quickOnboarding } from './utils/utils'
import SendToAddress from './usecases/SendToAddress'
import SecureSend from './usecases/SecureSend'

describe('Given Send', () => {
  beforeAll(async () => {
    await quickOnboarding()
  })

  describe('When sending to address', SendToAddress)
  describe('When sending to phone number with multiple mappings', SecureSend)
})
