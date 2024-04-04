import { fetchDappList } from '../utils/dappList'
import { getElementTextList, scrollIntoView } from '../utils/utils'
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

  it('should open internal webview with correct dapp when dapp opened', async () => {
    await scrollIntoView(dappToTest.dapp.name, 'DAppsExplorerScreen/DappsList')
    await element(by.text(dappToTest.dapp.name)).tap()
    await waitFor(element(by.id(`WebViewScreen/${dappToTest.dapp.name}`)))
      .toBeVisible()
      .withTimeout(10 * 1000)
    const url = new URL(dappToTest.dapp.url)
    // Should show correct hostname in webview
    await waitFor(element(by.text(url.hostname)))
      .toBeVisible()
      .withTimeout(10 * 1000)
    await element(by.id('WebViewScreen/CloseButton')).tap()
  })

  it(':ios: should correctly filter dapp list based on user agent', async () => {
    const iOSDappList = await fetchDappList('Valora/1.0.0 (iOS 15.0; iPhone)')
    const dappCards = await getElementTextList('DAppsExplorerScreen/AllSection/DappCard')
    jestExpect(dappCards.length).toEqual(iOSDappList.applications.length)
  })
}
