import DappListRecent from './usecases/DappListRecent'
import { quickOnboarding } from './utils/utils'

describe('Dapp List', () => {
  beforeAll(async () => {
    await quickOnboarding()
  })

  describe('Recent Dapps', DappListRecent)
})
