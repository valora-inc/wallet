import { reloadReactNative } from '../utils/retries'
import { sleep, waitForElementId } from '../utils/utils'

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
 * Scroll to a dapp in the dapp iOS only
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
    const recentlyUsedDapps = []

    beforeAll(async () => {
      try {
        await element(by.id('RecentDapp-name').withAncestor(by.id('RecentDapp')))
          .getAttributes()
          .then((recentDapps) => {
            if (recentDapps) recentlyUsedDapps.push(recentDapps)
          })
      } catch {}
    })

    it('should show most recently used dapp leftmost on home screen', async () => {
      // Get number of recently used dapps at start of test
      const startRecentCount =
        recentlyUsedDapps.length && recentlyUsedDapps[0].elements
          ? recentlyUsedDapps[0].elements.length
          : recentlyUsedDapps.length ?? 0

      // If recently use dapps is empty at start of test, it should not exist
      if (startRecentCount === 0) await expect(element(by.id('RecentDapp'))).not.toExist()

      // Navigate to DappList with sleep to allow for dapp list to load
      await navigateToDappList()
      await sleep(5 * 1000)
      await waitFor(element(by.id('DAppExplorerScreen/loading')))
        .not.toBeVisible()
        .withTimeout(30 * 1000)

      // Scroll to dapp and press
      await scrollToDapp(startRecentCount + 1)
      await element(by.id('DappCard')).atIndex(startRecentCount).tap()

      // Get dapp name in confirmation dialog
      const dappPressed = await element(by.id('ConfirmDappButton')).getAttributes()
      const dappPressedName = dappPressed.label.split('Go to ')[1]

      // Confirm dapp open and navigate back to home
      await element(by.id('ConfirmDappButton')).tap()
      await element(by.text('Close')).tap()
      await navigateToHome()

      // Check that recently used dapp is now first in list
      const mostRecentlyUsedDapp = await element(by.id('RecentDapp-name')).getAttributes()
      const mostRecentlyUsedDappName = mostRecentlyUsedDapp.elements
        ? mostRecentlyUsedDapp.elements[0].label
        : mostRecentlyUsedDapp.label
      jestExpect(dappPressedName).toEqual(mostRecentlyUsedDappName)
    })

    it('should show prompt to open most recently used dapp', async () => {
      // Get most recent dapp name
      const mostRecentlyUsedDapp = await element(
        by.id('RecentDapp-name').withAncestor(by.id('RecentDapp'))
      ).getAttributes()
      const mostRecentlyUsedDappName = mostRecentlyUsedDapp.elements
        ? mostRecentlyUsedDapp.elements[0].label
        : mostRecentlyUsedDapp.label

      // Open most recently used dapp
      await element(by.text(mostRecentlyUsedDappName)).tap()

      // Check that dapp open prompt is visible with the correct dapp name
      await waitForElementId('ConfirmDappButton')
      await waitFor(element(by.text(`Go to ${mostRecentlyUsedDappName}`)))
        .toBeVisible()
        .withTimeout(10 * 1000)
    })

    it('should correctly open most recently used dapp', async () => {
      await reloadReactNative()
      // Get most recent dapp name
      const mostRecentlyUsedDapp = await element(
        by.id('RecentDapp-name').withAncestor(by.id('RecentDapp'))
      ).getAttributes()
      const mostRecentlyUsedDappName = mostRecentlyUsedDapp.elements
        ? mostRecentlyUsedDapp.elements[0].label
        : mostRecentlyUsedDapp.label

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

  describe(':android:', () => {
    let mostRecentlyUsedDapp = null
    beforeAll(async () => {
      await reloadReactNative()
      try {
        mostRecentlyUsedDapp =
          (await element(by.id('RecentDapp-name')).atIndex(0).getAttributes()) ?? null
      } catch {}
    })

    it('should show most recently used dapp leftmost on home screen', async () => {
      if (!mostRecentlyUsedDapp) await expect(element(by.id('RecentDapp'))).not.toExist()

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
      const mostRecentlyUsedDappName = await element(by.id('RecentDapp-name'))
        .atIndex(0)
        .getAttributes()
      jestExpect(dappPressedName).toEqual(mostRecentlyUsedDappName.text)
    })

    it('should show prompt to open most recently used dapp', async () => {
      // Get dapp name
      const mostRecentlyUsedDappName = await element(by.id('RecentDapp-name'))
        .atIndex(0)
        .getAttributes()

      // Open most recently used dapp
      await element(by.text(mostRecentlyUsedDappName.text)).tap()

      // Check that dapp open prompt is visible with the correct dapp name
      await waitForElementId('ConfirmDappButton')
      await waitFor(element(by.text(`Go to ${mostRecentlyUsedDappName.text}`)))
        .toBeVisible()
        .withTimeout(10 * 1000)
    })

    it('should correctly open most recently used dapp', async () => {
      await reloadReactNative()
      const mostRecentlyUsedDappName = await element(by.id('RecentDapp-name'))
        .atIndex(0)
        .getAttributes()

      // Open most recently used dapp
      await element(by.text(mostRecentlyUsedDappName.text)).tap()
      await waitFor(element(by.text(`Go to ${mostRecentlyUsedDappName.text}`)))
        .toBeVisible()
        .withTimeout(10 * 1000)
      await element(by.id('ConfirmDappButton')).tap()

      // Check that webview screen is open for the correct dapp
      await waitFor(element(by.id(`WebViewScreen/${mostRecentlyUsedDappName.text}`)))
        .toBeVisible()
        .withTimeout(10 * 1000)
    })
  })
}
