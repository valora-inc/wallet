import { enterPinUiIfNecessary, inputNumberKeypad, sleep, getBalance } from '../utils/utils'
import { dismissBanners } from '../utils/banners'
import { reloadReactNative } from '../utils/retries'
const faker = require('faker')

const PHONE_NUMBER = '+12057368924'
const LAST_ACCOUNT_CHARACTERS = 'FD08'
const AMOUNT_TO_SEND = '0.5'

export default SecureSend = () => {
  beforeEach(async () => {
    await reloadReactNative()
    await dismissBanners()
    await waitFor(element(by.id('SendOrRequestBar/SendButton')))
      .toBeVisible()
      .withTimeout(30000)
    await element(by.id('SendOrRequestBar/SendButton')).tap()

    // Look for an address and tap on it.
    await element(by.id('SearchInput')).tap()
    await element(by.id('SearchInput')).replaceText(PHONE_NUMBER)
    await element(by.id('SearchInput')).tapReturnKey()
    await element(by.id('RecipientItem')).tap()
  })

  it('Then should be able to send cUSD to phone number', async () => {
    // Get starting balance
    let startBalance = await getBalance()
    console.log(startBalance)
    // Select cUSD
    await element(by.id('HeaderCurrencyPicker')).tap()
    await element(by.id('Option/cUSD')).tap()

    // Enter the amount and review
    await inputNumberKeypad(AMOUNT_TO_SEND)
    await element(by.id('Review')).tap()

    // hack: we shouldn't need this but the test fails without
    await sleep(3000)

    // Click Edit if confirm account isn't served
    try {
      await element(by.id('accountEditButton')).tap()
    } catch {}

    // Use the last digits of the account to confirm the sender.
    await waitFor(element(by.id('confirmAccountButton')))
      .toBeVisible()
      .withTimeout(30000)
    await element(by.id('confirmAccountButton')).tap()
    for (let index = 0; index < 4; index++) {
      const character = LAST_ACCOUNT_CHARACTERS[index]
      await element(by.id(`SingleDigitInput/digit${index}`)).replaceText(character)
    }
    await element(by.id('ConfirmAccountButton')).tap()

    // Write a comment.
    let randomContent = faker.lorem.words()
    await element(by.id('commentInput/send')).replaceText(`${randomContent}\n`)
    await element(by.id('commentInput/send')).tapReturnKey()

    // Wait for the confirm button to be clickable. If it takes too long this test
    // will be flaky :(
    await sleep(3000)

    // Confirm and input PIN if necessary.
    await element(by.id('ConfirmButton')).tap()
    await enterPinUiIfNecessary()

    // Return to home screen.
    await expect(element(by.id('SendOrRequestBar'))).toBeVisible()

    // Look for the latest transaction and assert
    await waitFor(element(by.text(`${randomContent}`)))
      .toBeVisible()
      .withTimeout(60 * 1000)
    // Get account balance
    let endBalance = await getBalance()
    // Assert balance is updated on chain
    jestExpect(endBalance['cUSD']).toBeCloseTo(startBalance['cUSD'] - AMOUNT_TO_SEND, 3)
  })

  it('Then should be able to send cEUR to phone number', async () => {
    // Select cEUR
    await element(by.id('HeaderCurrencyPicker')).tap()
    await element(by.id('Option/cEUR')).tap()

    // Enter the amount and review
    await inputNumberKeypad(AMOUNT_TO_SEND)
    await element(by.id('Review')).tap()

    // hack: we shouldn't need this but the test fails without
    await sleep(3000)

    // Click Edit if confirm account isn't served
    try {
      await element(by.id('accountEditButton')).tap()
    } catch {}

    // Use the last digits of the account to confirm the sender.
    await waitFor(element(by.id('confirmAccountButton')))
      .toBeVisible()
      .withTimeout(30000)
    await element(by.id('confirmAccountButton')).tap()
    for (let index = 0; index < 4; index++) {
      const character = LAST_ACCOUNT_CHARACTERS[index]
      await element(by.id(`SingleDigitInput/digit${index}`)).replaceText(character)
    }
    await element(by.id('ConfirmAccountButton')).tap()

    // Write a comment.
    let randomContent = faker.lorem.words()
    await element(by.id('commentInput/send')).replaceText(`${randomContent}\n`)
    await element(by.id('commentInput/send')).tapReturnKey()

    // Wait for the confirm button to be clickable. If it takes too long this test
    // will be flaky :(
    await sleep(3000)

    // Confirm and input PIN if necessary.
    await element(by.id('ConfirmButton')).tap()
    await enterPinUiIfNecessary()

    // Return to home screen.
    await expect(element(by.id('SendOrRequestBar'))).toBeVisible()

    // Look for the latest transaction and assert
    await waitFor(element(by.text(`${randomContent}`)))
      .toBeVisible()
      .withTimeout(60 * 1000)
  })
}
