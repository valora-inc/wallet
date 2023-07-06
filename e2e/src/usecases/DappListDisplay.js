import { fetchDappList, navigateToDappList } from '../utils/dappList'
import { reloadReactNative } from '../utils/retries'
import { getElementTextList, sleep, waitForElementId } from '../utils/utils'

jestExpect = require('expect')

export default DappListDisplay = () => {
  let dappList = null
  let dappToTest = null

  beforeAll(async () => {
    dappList = await fetchDappList()
    dappToTest = {
      dapp: dappList.applications.find((dapp) => dapp.id === 'impactmarket'),
      index: dappList.applications
        .filter((dapp) => dapp[device.getPlatform() === 'ios' ? 'listOnIos' : 'listOnAndroid'])
        .findIndex((dapp) => dapp.id === 'impactmarket'),
    }
  })

  it('should show dapp info icon and subsequent modal', async () => {
    await waitForElementId('DAppsExplorerScreen/HeaderButtons/HelpIcon')
    await element(by.id('DAppsExplorerScreen/HeaderButtons/HelpIcon')).tap()
    await waitForElementId('DAppsExplorerScreen/InfoBottomSheet/PrimaryAction')
    await element(by.id('DAppsExplorerScreen/InfoBottomSheet/PrimaryAction')).tap()

    await waitFor(element(by.id(`RNWebView`)))
      .toBeVisible()
      .withTimeout(10 * 1000)
    // Should show correct hostname in webview
    await waitFor(element(by.text('support.valoraapp.com')))
      .toBeVisible()
      .withTimeout(10 * 1000)
    await element(by.id('WebViewScreen/CloseButton')).tap()

    await waitFor(element(by.id('DAppsExplorerScreen/InfoBottomSheet')))
      .toBeVisible()
      .withTimeout(10 * 1000)
    await element(by.id('DAppsExplorerScreen/InfoBottomSheet')).swipe('down', 'fast')
  })

  it('should show dapp bottom sheet when dapp is selected', async () => {
    await element(by.id('DappCard')).atIndex(dappToTest.index).tap()
    await waitForElementId('ConfirmDappButton')
    await waitFor(element(by.text(`Go to ${dappToTest.dapp.name}`)))
      .toBeVisible()
      .withTimeout(10 * 1000)
  })

  it('should open internal webview with correct dapp when dapp opened', async () => {
    await element(by.id('ConfirmDappButton')).tap()
    await waitFor(element(by.id(`WebViewScreen/${dappToTest.dapp.name}`)))
      .toBeVisible()
      .withTimeout(10 * 1000)
    const url = new URL(dappToTest.dapp.url)
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
