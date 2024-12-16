import DappListDisplay from './usecases/DappListDisplay'
import { launchApp } from './utils/retries'
import { quickOnboarding, scrollIntoView, waitForElementById } from './utils/utils'

describe('Discover tab', () => {
  beforeAll(async () => {
    await quickOnboarding()
    // Relaunch app to ensure dapp list loads
    // Needed for e2e tests otherwise dapp list is not loaded on first pass
    await launchApp()
    await waitForElementById('Tab/Discover', { tap: true })

    await scrollIntoView('View All', 'DiscoverScrollView')
    await element(by.text('View All')).tap()

    await waitFor(element(by.id(`DappsScreen/DappsList`)))
  })

  describe('Dapp List Display', DappListDisplay)
})
