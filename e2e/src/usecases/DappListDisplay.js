import { fetchDappList, navigateToDappList } from '../utils/dappList'
import { reloadReactNative } from '../utils/retries'
import { getElementTextList, sleep, scrollIntoView, waitForElementId } from '../utils/utils'
import jestExpect from 'expect'

export default DappListDisplay = () => {
  let dappList = null
  let dappToTest = null

  beforeAll(async () => {
    dappList = await fetchDappList()
    dappToTest = {
      dapp: dappList.applications.find((dapp) => dapp.id === 'nftviewer'),
      index: dappList.applications
        .filter((dapp) => dapp[device.getPlatform() === 'ios' ? 'listOnIos' : 'listOnAndroid'])
        .findIndex((dapp) => dapp.id === 'nftviewer'),
    }
  })

  it('should show dapp bottom sheet when dapp is selected', async () => {
    await sleep(2000)
    await scrollIntoView(dappToTest.dapp.name, 'DAppsExplorerScreen/DappsList')
    await element(by.text(dappToTest.dapp.name)).tap()
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

  it(':ios: should correctly filter dapp list based on user agent', async () => {
    const iOSDappList = await fetchDappList('Valora/1.0.0 (iOS 14.5; iPhone)')
    await reloadReactNative()
    await navigateToDappList()
    // Give a few seconds for the dapp list to load
    await sleep(5 * 1000)
    const dappCards = await getElementTextList('DappCard')
    jestExpect(dappCards.length).toEqual(iOSDappList.applications.length)
  })
}
