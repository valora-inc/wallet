import HandleDeepLinkDappkit from './usecases/HandleDeepLinkDappkit'
import { quickOnboarding } from './utils/utils'

describe('Deep Link with account dappkit', () => {
  beforeAll(async () => {
    await quickOnboarding()
  })
  describe('HandleDeepLinkDappkit', HandleDeepLinkDappkit)
})
