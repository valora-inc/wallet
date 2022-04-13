import { DEFAULT_RECIPIENT_ADDRESS } from '../utils/consts'
import { reloadReactNative } from '../utils/retries'
import { enterPinUiIfNecessary, inputNumberKeypad, sleep, waitForElementId } from '../utils/utils'
const faker = require('@faker-js/faker')

const AMOUNT_TO_SEND = '0.1'
const AMOUNT_TO_REQUEST = '0.1'

export default Send = () => {
  describe('To Address', () => {
    beforeEach(async () => {
      await reloadReactNative()
      await waitFor(element(by.id('SendOrRequestBar/SendButton')))
        .toBeVisible()
        .withTimeout(30000)
      await element(by.id('SendOrRequestBar/SendButton')).tap()

      // Look for an address and tap on it.
      await element(by.id('SearchInput')).tap()
      await element(by.id('SearchInput')).replaceText(DEFAULT_RECIPIENT_ADDRESS)
      await element(by.id('SearchInput')).tapReturnKey()
      await element(by.id('RecipientItem')).atIndex(0).tap()

      // Continue send warning modal if present
      try {
        await waitFor(element(by.id('SendToAddressWarning/Continue')))
          .toBeVisible()
          .withTimeout(10 * 1000)
        await element(by.id('SendToAddressWarning/Continue')).tap()
      } catch {}
    })

    it('Then SBAT send cEUR', async () => {
      let randomContent = faker.lorem.words()
      // Tap token selector
      await element(by.id('onChangeToken')).tap()
      await element(by.id('cEURTouchable')).tap()

      // Enter the amount and review
      await inputNumberKeypad(AMOUNT_TO_SEND)
      await element(by.id('Review')).tap()

      await sleep(1000)

      // Write a comment.
      await element(by.id('commentInput/send')).replaceText(`${randomContent}\n`)
      await element(by.id('commentInput/send')).tapReturnKey()

      if (device.getPlatform() === 'android') {
        // Workaround keyboard remaining open on Android (tapReturnKey doesn't work there and just adds a new line)
        // so we tap something else in the scrollview to hide the soft keyboard
        await element(by.id('HeaderText')).tap()
      }

      // Wait for the confirm button to be clickable. If it takes too long this test
      // will be flaky :(
      await sleep(3000)
      await element(by.id('ConfirmButton')).tap()
      await sleep(3000)

      // Confirm and input PIN if necessary.
      await enterPinUiIfNecessary()

      // Should not throw error
      await expect(element(by.id('errorBanner'))).not.toBeVisible()

      // Return to home
      await waitForElementId('SendOrRequestBar')

      // TODO: See why these are taking so long in e2e tests to appear
      // Look for the latest transaction and assert
      // await waitFor(element(by.text(`${randomContent}`)))
      //   .toExist()
      //   .withTimeout(30 * 1000)
    })

    it('Then SBAT send CELO', async () => {
      let randomContent = faker.lorem.words()
      // Tap token selector
      await element(by.id('onChangeToken')).tap()
      await element(by.id('CELOTouchable')).tap()

      // Enter the amount and review
      await inputNumberKeypad(AMOUNT_TO_SEND)
      await element(by.id('Review')).tap()

      await sleep(1000)

      // No comments available in CELO
      await expect(element(by.id('commentInput/send'))).not.toExist()

      // Wait for the confirm button to be clickable. If it takes too long this test
      // will be flaky :(
      await sleep(3000)
      await element(by.id('ConfirmButton')).tap()
      await sleep(3000)

      // Confirm and input PIN if necessary.
      await enterPinUiIfNecessary()

      // Should not throw error
      await expect(element(by.id('errorBanner'))).not.toBeVisible()

      // Return to home
      await waitForElementId('SendOrRequestBar')

      // TODO: See why these are taking so long in e2e tests to appear
      // Look for the latest transaction and assert
      // await waitFor(element(by.text(`${randomContent}`)))
      //   .toExist()
      //   .withTimeout(30 * 1000)
    })

    it('Then SBAT send cUSD', async () => {
      let randomContent = faker.lorem.words()
      // Tap token selector
      await element(by.id('onChangeToken')).tap()
      await element(by.id('cUSDTouchable')).tap()

      // Enter the amount and review
      await inputNumberKeypad(AMOUNT_TO_SEND)
      await element(by.id('Review')).tap()

      await sleep(1000)

      // Write a comment.
      await element(by.id('commentInput/send')).replaceText(`${randomContent}\n`)
      await element(by.id('commentInput/send')).tapReturnKey()

      if (device.getPlatform() === 'android') {
        // Workaround keyboard remaining open on Android (tapReturnKey doesn't work there and just adds a new line)
        // so we tap something else in the scrollview to hide the soft keyboard
        await element(by.id('HeaderText')).tap()
      }

      // Wait for the confirm button to be clickable. If it takes too long this test
      // will be flaky :(
      await sleep(3000)
      await element(by.id('ConfirmButton')).tap()
      await sleep(3000)

      // Confirm and input PIN if necessary.
      await enterPinUiIfNecessary()

      // Should not throw error
      await expect(element(by.id('errorBanner'))).not.toBeVisible()

      // Return to home
      await waitForElementId('SendOrRequestBar')

      // TODO: See why these are taking so long in e2e tests to appear
      // Look for the latest transaction and assert
      // await waitFor(element(by.text(`${randomContent}`)))
      //   .toExist()
      //   .withTimeout(30 * 1000)
    })
  })

  it('Then SBAT perform Nomspace lookup', async () => {
    await reloadReactNative()
    await waitFor(element(by.id('SendOrRequestBar/SendButton')))
      .toBeVisible()
      .withTimeout(30000)
    await element(by.id('SendOrRequestBar/SendButton')).tap()
    // Look for an address and tap on it.
    await element(by.id('SearchInput')).tap()
    await element(by.id('SearchInput')).replaceText('Hello.nom')
    await waitFor(element(by.id('RecipientItem')))
      .toBeVisible()
      .withTimeout(10 * 1000)
  })
}
