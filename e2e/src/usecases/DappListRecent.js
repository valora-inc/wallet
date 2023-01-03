import { reloadReactNative } from '../utils/retries'
import { sleep, waitForElementId, getElementText, getElementTextList } from '../utils/utils'

const jestExpect = require('expect')

/**
 * From the home screen, navigate to the dapp explorer screen
 */
async function navigateToDappList() {
  await waitForElementId('Hamburger')
  await element(by.id('Hamburger')).tap()
  await waitForElementId('dapps-explorer-icon')
  await element(by.id('dapps-explorer-icon')).tap()
  await sleep(5 * 1000)
  await waitFor(element(by.id('DAppExplorerScreen/loading')))
    .not.toBeVisible()
    .withTimeout(30 * 1000)
}

/**
 * From the drawer navigate to home screen
 */
async function navigateToHome() {
  await waitForElementId('Hamburger')
  await element(by.id('Hamburger')).tap()
  await waitForElementId('Home')
  await element(by.id('Home')).tap()
}

/**
 * Scroll to a dapp in the dapp - iOS only
 * @param {number} dappIndex: index of dapp to scroll to
 */
async function scrollToDapp(dappIndex = 0) {
  try {
    await waitFor(element(by.id('DappCard')).atIndex(dappIndex))
      .toBeVisible(100)
      .whileElement(by.id('DAppExplorerScreen/DappsList'))
      .scroll(250, 'down')
  } catch {
    console.log('Catch of scrollToDapp')
  }
}

export default DappListRecent = () => {
  describe(':ios:', () => {
    it('should show most recently used dapp leftmost on home screen', async () => {
      // Get recently used dapps at start of test
      const startRecentlyUsedDapps = await getElementTextList('RecentDapp-name')
      const startRecentDappCount = startRecentlyUsedDapps.length

      // If no recently used dapps check that RecentDapp element does not exist
      if (startRecentDappCount === 0) await expect(element(by.id('RecentDapp'))).not.toExist()

      // Navigate to DappList with sleep to allow for dapp list to load
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
      const endRecentlyUsedDapps = await getElementTextList('RecentDapp-name')
      jestExpect(dappPressedName).toEqual(endRecentlyUsedDapps[0])
    })

    it('should show prompt to open most recently used dapp', async () => {
      // Get recently used dapps name at start of test
      const recentlyUsedDapps = await getElementTextList('RecentDapp-name')
      const mostRecentlyUsedDapp = recentlyUsedDapps[0]

      // Open most recently used dapp
      await element(by.text(mostRecentlyUsedDapp)).tap()

      // Check that dapp open prompt is visible with the correct dapp name
      await waitForElementId('ConfirmDappButton')
      await waitFor(element(by.text(`Go to ${mostRecentlyUsedDapp}`)))
        .toBeVisible()
        .withTimeout(10 * 1000)
    })

    it('should correctly open most recently used dapp', async () => {
      // Reload to Home screen
      await reloadReactNative()

      // Get recently used dapps
      const recentlyUsedDapps = await getElementTextList('RecentDapp-name')
      const mostRecentlyUsedDapp = recentlyUsedDapps[0]

      // Open most recently used dapp
      await element(by.text(mostRecentlyUsedDapp)).tap()
      await waitFor(element(by.text(`Go to ${mostRecentlyUsedDapp}`)))
        .toBeVisible()
        .withTimeout(10 * 1000)
      await element(by.id('ConfirmDappButton')).tap()

      // Check that webview screen is open for the correct dapp
      await waitFor(element(by.id(`WebViewScreen/${mostRecentlyUsedDapp}`)))
        .toBeVisible()
        .withTimeout(10 * 1000)
    })
  })

  describe(':android:', () => {
    it('should show most recently used dapp leftmost on home screen', async () => {
      // Get most recently used dapp at start of test
      const mostRecentlyUsedDappName = await getElementText('RecentDapp-name')

      // If no recently used dapps check that RecentDapp element does not exist
      if (mostRecentlyUsedDappName === null)
        await expect(element(by.id('RecentDapp'))).not.toExist()

      // Navigate to DappList with sleep to allow for dapp list to load
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
      jestExpect(dappPressedName).toEqual(await getElementText('RecentDapp-name'))
    })

    it('should show prompt to open most recently used dapp', async () => {
      // Get most recently used dapp name
      const mostRecentlyUsedDappName = await getElementText('RecentDapp-name')

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
      const mostRecentlyUsedDappName = await getElementText('RecentDapp-name')

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
  })
}
