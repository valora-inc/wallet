import { reloadReactNative } from '../utils/retries'
import { getElementText, getElementTextList, scrollIntoView } from '../utils/utils'
import { navigateToDappList, navigateToHome } from '../utils/dappList'

import jestExpect from 'expect'

export default DappListRecent = () => {
  const dappToTest = 'impactMarket'

  it('should show most recently used dapp leftmost on home screen', async () => {
    // Get recently used dapps at start of test
    const startRecentlyUsedDapps = await getElementTextList('RecentlyUsedDapps/Name')
    const startRecentDappCount = startRecentlyUsedDapps.length

    // Reruns of the tests on iOS will select the next dapp not in the recent dapp list
    // If no recently used dapps check that RecentDapp element does not exist
    // Else check that All Dapps button exists
    startRecentDappCount === 0
      ? await expect(element(by.id('RecentDapp'))).not.toExist()
      : await expect(element(by.text('All Dapps'))).toExist()

    // TODO: Remove when initial dapp list fetch issue fix
    // Navigate to DappList reload and navigate again - ci issue
    await navigateToDappList()

    // Scroll to impact market dapp
    await scrollIntoView(dappToTest, 'DAppsExplorerScreen/DappsList')
    await element(by.text(dappToTest)).tap()

    // Close internal webview and navigate back to home
    await waitFor(element(by.id(`WebViewScreen/${dappToTest}`)))
      .toBeVisible()
      .withTimeout(10 * 1000)
    await element(by.text('Close')).tap()
    await navigateToHome()

    // Check that recently used dapp is now first in list
    const endRecentlyUsedDapps = await getElementTextList('RecentlyUsedDapps/Name')
    jestExpect(dappToTest).toEqual(endRecentlyUsedDapps[0])
    jestExpect(endRecentlyUsedDapps.length).toEqual(startRecentDappCount + 1)
  })

  it('should correctly open most recently used dapp', async () => {
    // Reload to Home screen
    await reloadReactNative()

    // Get most recently used dapp name
    const mostRecentlyUsedDappName = await getElementText('RecentlyUsedDapps/Name')

    // Open most recently used dapp
    await element(by.text(mostRecentlyUsedDappName)).tap()

    // Check that webview screen is open for the correct dapp
    await waitFor(element(by.id(`WebViewScreen/${mostRecentlyUsedDappName}`)))
      .toBeVisible()
      .withTimeout(10 * 1000)
  })

  it('should correctly navigate via all dapps card', async () => {
    // Reload to Home screen
    await reloadReactNative()

    // Tap All Dapps Button
    await scrollIntoView('All Dapps', 'RecentlyUsedDapps/ScrollContainer', 250, 'right')
    await element(by.text('All Dapps')).tap()

    // Check that DappList screen is open
    await waitFor(element(by.id('DAppsExplorerScreen/DappsList')))
      .toExist()
      .withTimeout(10 * 1000)
  })
}
