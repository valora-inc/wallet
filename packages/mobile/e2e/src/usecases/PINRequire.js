import { dismissBanners } from '../utils/banners'
import { scrollIntoView } from '../utils/utils'
const jestExpect = require('expect')

export default RequirePIN = () => {
  beforeEach(async () => {
    await dismissBanners()
    await element(by.id('Hamburger')).tap()
    await scrollIntoView('Settings', 'SettingsScrollView')
    await waitFor(element(by.id('Settings')))
      .toBeVisible()
      .withTimeout(30000)
    await element(by.id('Settings')).tap()
  })

  it('Then should be require PIN on app open', async () => {
    // Request Pin on App Open disabled by default
    let pinToggleBefore = await element(by.id('requirePinOnAppOpenToggle')).getAttributes()
    jestExpect(pinToggleBefore.value).toEqual('0')

    await element(by.id('requirePinOnAppOpenToggle')).tap()
    let pinToggleAfter = await element(by.id('requirePinOnAppOpenToggle')).getAttributes()
    jestExpect(pinToggleAfter.value).toEqual('1')
    await device.reloadReactNative()
    await expect(element(by.text('Enter PIN'))).toBeVisible()
  })
}
