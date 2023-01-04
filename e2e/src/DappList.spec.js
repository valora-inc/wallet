import DappListRecent from './usecases/DappListRecent'
import DappListDisplay from './usecases/DappListDisplay'
import { quickOnboarding } from './utils/utils'
import { launchApp } from './utils/retries'
import { waitForElementId } from './utils/utils'
import fetch from 'node-fetch'

/**
 * Fetch the Dapp list from the cloud function using node-fetch
 * @param {string} userAgent: user agent to use for dapp list fetch
 * @returns {object|null} dappList: list of dapps
 */
export async function fetchDappList(userAgent = '') {
  let dappList = null
  try {
    const response = await fetch(
      'https://us-central1-celo-mobile-alfajores.cloudfunctions.net/dappList',
      {
        headers: {
          'User-Agent': userAgent,
        },
      }
    )
    if (response.status === 200) {
      dappList = await response.json()
    }
  } catch {}
  return dappList
}

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
  await waitFor(element(by.id('DAppExplorerScreen/loading')))
    .not.toBeVisible()
    .withTimeout(30 * 1000)
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

describe('Dapp List', () => {
  beforeAll(async () => {
    await quickOnboarding()
    // Relaunch app to ensure dapp list loads
    // TODO: Remove this once we have a better way to ensure dapp list loads
    await launchApp({ newInstance: true })
  })

  describe('Recent Dapps', DappListRecent)
  describe('Dapp List Display', DappListDisplay)
})
