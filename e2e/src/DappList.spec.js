import DappListRecent from './usecases/DappListRecent'
import { quickOnboarding } from './utils/utils'
import { launchApp } from './utils/retries'

describe('Dapp List', () => {
  beforeAll(async () => {
    await quickOnboarding()
    // Relaunch app to ensure dapp list loads
    // Needed for e2e tests otherwise dapp list is not loaded on first pass
    await launchApp({ newInstance: true })
  })

  describe('Recent Dapps', DappListRecent)
})
