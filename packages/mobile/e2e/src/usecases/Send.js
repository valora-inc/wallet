import { enterPinUiIfNecessary, inputNumberKeypad, sleep } from '../utils/utils'
import { DEFAULT_RECIPIENT_ADDRESS } from '../utils/consts'
import { errorDismiss } from '../utils/banners'

const AMOUNT_TO_SEND = '0.1'
const AMOUNT_TO_REQUEST = '0.1'
const RANDOM_COMMENT = 'poker night winnings 🎰'

export default Send = () => {
  beforeEach(async () => {
    await device.reloadReactNative()
    await errorDismiss()
  })

  it('Send cUSD to address', async () => {
    await element(by.id('SendOrRequestBar/SendButton')).tap()

    // Look for an address and tap on it.
    await element(by.id('SearchInput')).tap()
    await element(by.id('SearchInput')).replaceText(DEFAULT_RECIPIENT_ADDRESS)
    await element(by.id('SearchInput')).tapReturnKey()
    await element(by.id('RecipientItem')).tap()

    // Enter the amount and review
    await inputNumberKeypad(AMOUNT_TO_SEND)
    await element(by.id('Review')).tap()

    // Write a comment.
    await element(by.id('commentInput/send')).replaceText(`${RANDOM_COMMENT}\n`)

    // Wait for the confirm button to be clickable. If it takes too long this test
    // will be flaky :(
    await sleep(3000)
    await waitFor(element(by.id('ConfirmButton')))
      .toExist()
      .withTimeout(6000)
    await element(by.id('ConfirmButton')).tap()

    // Confirm and input PIN if necessary.
    await enterPinUiIfNecessary()

    // Should not throw error
    await expect(element(by.id('errorBanner'))).not.toBeVisible()

    // Return to home.
    await expect(element(by.id('SendOrRequestBar'))).toBeVisible()
    // TODO(erdal): look for the latest transaction and assert
  })

  // TODO(tomm): debug why error is thrown in e2e tests
  it.skip('Request cUSD from address', async () => {
    await element(by.id('SendOrRequestBar/RequestButton')).tap()

    // Look for an address and tap on it.
    await element(by.id('SearchInput')).tap()
    await element(by.id('SearchInput')).replaceText(DEFAULT_RECIPIENT_ADDRESS)
    await element(by.id('SearchInput')).tapReturnKey()
    await element(by.id('RecipientItem')).tap()

    // Enter the amount and review
    await inputNumberKeypad(AMOUNT_TO_REQUEST)
    await element(by.id('Review')).tap()

    // Write a comment.
    await element(by.id('commentInput/request')).replaceText(`${RANDOM_COMMENT}\n`)

    // Confirm and input PIN if necessary.
    await enterPinUiIfNecessary()

    // Should not throw error
    await expect(element(by.id('errorBanner'))).not.toBeVisible()

    // Return to home.
    await expect(element(by.id('SendOrRequestBar'))).toBeVisible()
  })
}
