import { quickOnboarding } from './utils/utils'
import HandleDeepLinkDappkit from './usecases/HandleDeepLinkDappkit'

describe('Deep Link with account dappkit', () => {
  beforeAll(async () => {
    await quickOnboarding()
  })
  describe('HandleDeepLinkDappkit', HandleDeepLinkDappkit)
})
