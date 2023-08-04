import SecureSend from './usecases/SecureSend'
import Send from './usecases/Send'
import { quickOnboarding } from './utils/utils'

describe('Given', () => {
  beforeAll(async () => {
    await quickOnboarding()
  })

  describe('Send', Send)
  // TODO: unskip this test if we enable CPV in CI
  describe.skip('SecureSend cUSD', SecureSend)
})
