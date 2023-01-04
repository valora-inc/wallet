import DappListRecent from './usecases/DappListRecent'
import { quickOnboarding } from './utils/utils'
import { launchApp } from './utils/retries'

describe('Dapp List', () => {
  beforeAll(async () => {
    await quickOnboarding()
    // Relaunch app to ensure dapp list loads
    // TODO: Remove this once we have a better way to ensure dapp list loads
    await launchApp({ newInstance: true })
  })

  describe('Recent Dapps', DappListRecent)
})
