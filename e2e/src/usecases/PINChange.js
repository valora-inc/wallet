import { ALTERNATIVE_PIN, DEFAULT_PIN } from '../utils/consts'
import { reloadReactNative } from '../utils/retries'
import { enterPinUi, scrollIntoView, sleep, waitForElementId } from '../utils/utils'

export default ChangePIN = () => {
  it('Then should be retain changed PIN', async () => {
    await waitForElementId('Hamburger')
    await element(by.id('Hamburger')).tap()
    await scrollIntoView('Settings', 'SettingsScrollView')
    await waitFor(element(by.id('Settings')))
      .toBeVisible()
      .withTimeout(30 * 1000)
    await element(by.id('Settings')).tap()
    await waitForElementId('ChangePIN')
    await element(by.id('ChangePIN')).tap()
    // Existing PIN is needed first
    await sleep(500)
    await enterPinUi(DEFAULT_PIN)
    await sleep(500)
    // Then we enter the new PIN
    await enterPinUi(ALTERNATIVE_PIN)
    await sleep(500)

    // Enter an invalid pin and check that we get the correct error and start over
    await enterPinUi('902100')
    await waitFor(element(by.text("The PINs didn't match")))
      .toBeVisible()
      .withTimeout(15 * 1000)

    // Then we enter the new PIN
    await enterPinUi(ALTERNATIVE_PIN)
    await sleep(500)

    // Then confirm the new PIN
    await enterPinUi(ALTERNATIVE_PIN)
    await sleep(500)

    // Reload app and navigate to change pin
    await reloadReactNative()
    await waitForElementId('Hamburger')
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
