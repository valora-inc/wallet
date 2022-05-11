import { ALTERNATIVE_PIN, DEFAULT_PIN } from '../utils/consts'
import { reloadReactNative } from '../utils/retries'
import { enterPinUi, scrollIntoView, sleep } from '../utils/utils'

export default ChangePIN = () => {
  beforeEach(async () => {
    await element(by.id('Hamburger')).tap()
    await scrollIntoView('Settings', 'SettingsScrollView')
    await waitFor(element(by.id('Settings')))
      .toBeVisible()
      .withTimeout(30 * 1000)
    await element(by.id('Settings')).tap()
  })

  it('Then should be retain changed PIN', async () => {
    await waitFor(element(by.id('ChangePIN')))
      .toBeVisible()
      .withTimeout(5000)
    await element(by.id('ChangePIN')).tap()
    // Existing PIN is needed first
    await sleep(500)
    await enterPinUi(DEFAULT_PIN)
    await sleep(500)
    // Then we enter the new PIN
    await enterPinUi(ALTERNATIVE_PIN)
    await sleep(500)
    // Then confirm the new PIN
    await enterPinUi(ALTERNATIVE_PIN)
    await sleep(500)

    // Reload app and navigate to change pin
    await reloadReactNative()
    await element(by.id('Hamburger')).tap()
    await scrollIntoView('Settings', 'SettingsScrollView')
    await waitFor(element(by.id('Settings')))
      .toBeVisible()
      .withTimeout(30 * 1000)
    await element(by.id('Settings')).tap()
    await element(by.id('ChangePIN')).tap()
    // Now try to change it again and enter the old PIN
    await sleep(500)
    await enterPinUi(DEFAULT_PIN)
    // Check old PIN doesn't work anymore
    await expect(element(by.text('Incorrect PIN'))).toBeVisible()
    await enterPinUi(ALTERNATIVE_PIN)
    await expect(element(by.text('Create a new PIN'))).toBeVisible()
  })
}
