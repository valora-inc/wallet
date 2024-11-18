import { quickOnboarding, waitForElementByIdAndTap, scrollIntoView } from './utils/utils'
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
    })
    await waitForElementByIdAndTap('Tab/Discover')

    await scrollIntoView('View All', 'DiscoverScrollView')
    await element(by.text('View All')).tap()

    await waitFor(element(by.id(`DappsScreen/DappsList`)))
  })

  describe('Dapp List Display', DappListDisplay)
})
