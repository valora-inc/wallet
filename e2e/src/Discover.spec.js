import { quickOnboarding, waitForElementByIdAndTap } from './utils/utils'
import { launchApp } from './utils/retries'
import DappListDisplay from './usecases/DappListDisplay'

describe('Discover tab', () => {
  beforeAll(async () => {
    await quickOnboarding()
    // Relaunch app to ensure dapp list loads
    // Needed for e2e tests otherwise dapp list is not loaded on first pass
    await launchApp({
      newInstance: true,
      permissions: { notifications: 'YES', contacts: 'YES', camera: 'YES' },
      launchArgs: {
        statsigGateOverrides: `use_tab_navigator=true`,
      },
    })
    await waitForElementByIdAndTap('Tab/Discover')
  })

  describe('Dapp List Display', DappListDisplay)
})
