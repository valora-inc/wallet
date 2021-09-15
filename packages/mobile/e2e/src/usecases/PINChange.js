import { dismissBanners } from '../utils/banners'
import { ALTERNATIVE_PIN, DEFAULT_PIN } from '../utils/consts'
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
    await enterPinUi(DEFAULT_PIN)
    // Then we enter the new PIN
    await enterPinUi(ALTERNATIVE_PIN)
    // Then confirm the new PIN
    await enterPinUi(ALTERNATIVE_PIN)
    await element(by.id('ChangePIN')).tap()
    // Now try to change it again and enter the old PIN
    await enterPinUi(DEFAULT_PIN)
    // Check old PIN doesn't work anymore
    await expect(element(by.text('Incorrect PIN'))).toBeVisible()
    await enterPinUi(ALTERNATIVE_PIN)
    await expect(element(by.text('Create a new PIN'))).toBeVisible()
  })
}
