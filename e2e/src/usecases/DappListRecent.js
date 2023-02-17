import { reloadReactNative } from '../utils/retries'
import {
  waitForElementId,
  getElementText,
  getElementTextList,
  scrollIntoView,
} from '../utils/utils'
import { navigateToDappList, scrollToDapp, navigateToHome } from '../utils/dappList'

const jestExpect = require('expect')

export default DappListRecent = () => {
  it('should show most recently used dapp leftmost on home screen :ios:', async () => {
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

    // Scroll to first dapp or next after most recent dapp
    await scrollToDapp(startRecentDappCount + 1)
    await element(by.id('DappCard')).atIndex(startRecentDappCount).tap()

    // Get dapp name in confirmation dialog
    const dappPressed = await element(by.id('ConfirmDappButton')).getAttributes()
    const dappPressedName = dappPressed.label.split('Go to ')[1]

    // Confirm dapp open and navigate back to home
    await element(by.id('ConfirmDappButton')).tap()
    await element(by.text('Close')).tap()
    await navigateToHome()

    // Check that recently used dapp is now first in list
    const endRecentlyUsedDapps = await getElementTextList('RecentlyUsedDapps/Name')
    jestExpect(dappPressedName).toEqual(endRecentlyUsedDapps[0])
    jestExpect(endRecentlyUsedDapps.length).toEqual(startRecentDappCount + 1)
  })

  it('should show most recently used dapp leftmost on home screen :android:', async () => {
    // Get most recently used dapp at start of test
    const mostRecentlyUsedDappName = await getElementText('RecentlyUsedDapps/Name')

    // If no recently used dapps check that RecentDapp element does not exist
    if (mostRecentlyUsedDappName === null) {
      await expect(element(by.id('RecentDapp'))).not.toExist()
    }

    // Navigate to DappList reload and navigate again - ci issue
    await navigateToDappList()

    // Scroll doesn't work well for android so we just tap the first dapp
    await element(by.id('DappCard')).atIndex(0).tap()

    // Get dapp name in confirmation dialog
    const dappPressed = await element(by.id('ConfirmDappTitle')).getAttributes()
    const dappPressedName = dappPressed.text.split(' is an external application')[0]

    // Confirm dapp open and navigate back to home
    await waitForElementId('ConfirmDappButton')
    await element(by.id('ConfirmDappButton')).tap()
    await element(by.text('Close')).tap()
    await navigateToHome()

    // Check that recently used dapp is now first in list
    jestExpect(dappPressedName).toEqual(await getElementText('RecentlyUsedDapps/Name'))
  })

  it('should show prompt to open most recently used dapp', async () => {
    // Get most recently used dapp name
    const mostRecentlyUsedDappName = await getElementText('RecentlyUsedDapps/Name')

    // Open most recently used dapp
    await element(by.text(mostRecentlyUsedDappName)).tap()

    // Check that dapp open prompt is visible with the correct dapp name
    await waitForElementId('ConfirmDappButton')
    await waitFor(element(by.text(`Go to ${mostRecentlyUsedDappName}`)))
      .toBeVisible()
      .withTimeout(10 * 1000)
  })

  it('should correctly open most recently used dapp', async () => {
    // Reload to Home screen
    await reloadReactNative()

    // Get most recently used dapp name
    const mostRecentlyUsedDappName = await getElementText('RecentlyUsedDapps/Name')

    // Open most recently used dapp
    await element(by.text(mostRecentlyUsedDappName)).tap()
    await waitFor(element(by.text(`Go to ${mostRecentlyUsedDappName}`)))
      .toBeVisible()
      .withTimeout(10 * 1000)
    await element(by.id('ConfirmDappButton')).tap()

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
