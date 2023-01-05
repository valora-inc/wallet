import { waitForElementId } from './utils'

/**
 * From the home screen, navigate to the dapp explorer screen
 * Disable detox device synchronization to allow for dapp list to load
 * https://github.com/wix/Detox/issues/2799
 */
export async function navigateToDappList() {
  await device.disableSynchronization()
  await waitForElementId('Hamburger')
  await element(by.id('Hamburger')).tap()
  await waitForElementId('dapps-explorer-icon')
  await element(by.id('dapps-explorer-icon')).tap()
  await waitFor(element(by.id('DAppExplorerScreen/DappsList')))
    .toExist()
    .withTimeout(10 * 1000)
  await device.enableSynchronization()
}

/**
 * From the drawer navigate to home screen
 */
export async function navigateToHome() {
  await waitForElementId('Hamburger')
  await element(by.id('Hamburger')).tap()
  await waitForElementId('Home')
  await element(by.id('Home')).tap()
}

/**
 * Scroll to a dapp in the dapp - iOS only
 * @param {number} dappIndex: index of dapp to scroll to
 */
export async function scrollToDapp(dappIndex = 0) {
  try {
    await waitFor(element(by.id('DappCard')).atIndex(dappIndex))
      .toBeVisible(100)
      .whileElement(by.id('DAppExplorerScreen/DappsList'))
      .scroll(250, 'down')
  } catch {
    console.log('Catch of scrollToDapp')
  }
}
