import DappListRecent from './usecases/DappListRecent'
import DappListDisplay from './usecases/DappListDisplay'
import { quickOnboarding } from './utils/utils'
import { launchApp } from './utils/retries'

describe('Dapp List', () => {
  beforeAll(async () => {
    // Relaunch app to ensure dapp list loads
    // Needed for e2e tests otherwise dapp list is not loaded on first pass
    await launchApp({ newInstance: true })
    await quickOnboarding()
  })

  describe('Recent Dapps', DappListRecent)
  describe('Dapp List Display', DappListDisplay)
})
