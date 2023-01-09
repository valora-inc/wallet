import { reloadReactNative } from '../utils/retries'
import { waitForElementId, getElementText, getElementTextList, sleep } from '../utils/utils'
import { navigateToDappList, fetchDappList } from '../utils/dappList'

jestExpect = require('expect')

export default DappListDisplay = () => {
  let dappList = null
  beforeAll(async () => {
    dappList = await fetchDappList()
  })

  it('should show correct featured dapp', async () => {
    await navigateToDappList()
    const featuredDappName = await getElementText('FeaturedDapp/Name')
    await jestExpect(featuredDappName).toEqual(dappList.featured.name)
  })

  it('should show dapp info icon and subsequent modal', async () => {
    await waitForElementId('DAppsExplorerScreen/HelpIcon')
    await element(by.id('DAppsExplorerScreen/HelpIcon')).tap()
    await waitForElementId('DAppsExplorerScreen/HelpDialog/PrimaryAction')
    await element(by.id('DAppsExplorerScreen/HelpDialog/PrimaryAction')).tap()
    await waitFor(element(by.id('DAppsExplorerScreen/HelpDialog/PrimaryAction')))
      .not.toBeVisible()
      .withTimeout(10 * 1000)
  })

  it('should show dapp bottom sheet when dapp is selected', async () => {
    await element(by.id('DappCard')).atIndex(0).tap()
    await waitForElementId('ConfirmDappButton')
    await waitFor(element(by.text(`Go to ${dappList.applications[0].name}`)))
      .toBeVisible()
      .withTimeout(10 * 1000)
  })

  it('should open internal webview with correct dapp when dapp opened', async () => {
    await element(by.id('ConfirmDappButton')).tap()
    await waitFor(element(by.id(`WebViewScreen/${dappList.applications[0].name}`)))
      .toBeVisible()
      .withTimeout(10 * 1000)
    const url = new URL(dappList.applications[0].url)
    // Should show correct hostname in webview
    await waitFor(element(by.text(url.hostname)))
      .toBeVisible()
      .withTimeout(10 * 1000)
  })

  it('should correctly filter dapp list based on user agent :ios:', async () => {
    const iOSDappList = await fetchDappList('Valora/1.0.0 (iOS 14.5; iPhone)')
    await reloadReactNative()
    await navigateToDappList()
    // Give a few seconds for the dapp list to load
    await sleep(5 * 1000)
    const dappCards = await getElementTextList('DappCard')
    jestExpect(dappCards.length).toEqual(iOSDappList.applications.length)
  })
}
