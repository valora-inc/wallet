import fetch from 'node-fetch'
import { waitForElementById } from './utils'

/**
 * From the home screen, navigate to the dapp explorer screen
 * Disable detox device synchronization to allow for dapp list to load
 * https://github.com/wix/Detox/issues/2799
 */
export async function navigateToDappList() {
  await device.disableSynchronization()
  await waitForElementById('Hamburger', { tap: true })
  await waitForElementById('dapps-explorer-icon', { tap: true })
  await waitForElementById('DAppsExplorerScreen/DappsList')
  await device.enableSynchronization()
}

/**
 * From the drawer navigate to home screen
 */
export async function navigateToHome() {
  await waitForElementById('Hamburger', { tap: true })
  await waitForElementById('Home', { tap: true })
}

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
