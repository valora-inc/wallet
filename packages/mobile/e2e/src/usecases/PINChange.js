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
    // Existing PIN is needed first
    await enterPinUi()
    // Then we enter the new PIN
    await enterPinUi('223344')
    // Then confirm the new PIN
    await enterPinUi('223344')
    await element(by.id('ChangePIN')).tap()
    // Now try to change it again and enter the old PIN
    await enterPinUi()
    // Check old PIN doesn't work anymore
    await expect(element(by.text('Incorrect PIN'))).toBeVisible()
    await enterPinUi('223344')
    await expect(element(by.text('Create a new PIN'))).toBeVisible()
  })
}
