import { dismissBanners } from '../utils/banners'
import { enterPinUi, scrollIntoView } from '../utils/utils'

export default ChangePIN = () => {
  beforeEach(async () => {
    await dismissBanners()
    await element(by.id('Hamburger')).tap()
    await scrollIntoView('Settings', 'SettingsScrollView')
    await waitFor(element(by.id('Settings')))
      .toBeVisible()
      .withTimeout(30000)
    await element(by.id('Settings')).tap()
  })

  it('Then should be retain changed PIN', async () => {
    await waitFor(element(by.id('ChangePIN')))
      .toBeVisible()
      .withTimeout(5000)
    await element(by.id('ChangePIN')).tap()
    await enterPinUi()
    await enterPinUi('223344')
    await enterPinUi('223344')
    await element(by.id('ChangePIN')).tap()
    await enterPinUi()
    await expect(element(by.text('Incorrect PIN'))).toBeVisible()
    await enterPinUi('223344')
    await expect(element(by.text('Create a new PIN'))).toBeVisible()
  })
}
