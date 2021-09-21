import {
  enterPinUiIfNecessary,
  inputNumberKeypad,
  sleep,
  waitForExpectNotVisible,
} from '../utils/utils'
import { DEFAULT_RECIPIENT_ADDRESS } from '../utils/consts'
import { dismissBanners } from '../utils/banners'
import { reloadReactNative } from '../utils/retries'
import { getBalance } from '../utils/utils'

const faker = require('faker')
const jestExpect = require('expect')
const AMOUNT_TO_SEND = 0.1

export default SendToAddress = () => {
  beforeEach(async () => {
    await reloadReactNative()
    await dismissBanners()
    await waitFor(element(by.id('SendOrRequestBar/SendButton')))
      .toBeVisible()
      .withTimeout(30000)
    await element(by.id('SendOrRequestBar/SendButton')).tap()
    // Look for an address and tap on it.
    await element(by.id('SearchInput')).tap()
    await element(by.id('SearchInput')).replaceText(DEFAULT_RECIPIENT_ADDRESS)
    await element(by.id('SearchInput')).tapReturnKey()
    await element(by.id('RecipientItem')).tap()
    // Continue send warning modal if present
    try {
      await waitFor(element(by.id('SendToAddressWarning/Continue')))
        .toBeVisible()
        .withTimeout(10000)
      await element(by.id('SendToAddressWarning/Continue')).tap()
    } catch {}
  })

  jest.retryTimes(2)
  it('Then should be able to send cUSD to address', async () => {
    // Get starting balance
    let startBalance = await getBalance()
    // Select cUSD
    await element(by.id('HeaderCurrencyPicker')).tap()
    await element(by.id('Option/cUSD')).tap()
    // Enter the amount and review
    await inputNumberKeypad(`${AMOUNT_TO_SEND}`)
    await element(by.id('Review')).tap()
    // Sleep 1 second
    await sleep(1000)
    // Write a comment
    let randomContent = faker.lorem.words()
    await element(by.id('commentInput/send')).replaceText(`${randomContent}\n`)
    await element(by.id('commentInput/send')).tapReturnKey()
    // Workaround keyboard remaining open on Android (tapReturnKey doesn't work there and just adds a new line)
    if (device.getPlatform() === 'android') {
      // so we tap something else in the scrollview to hide the soft keyboard
      await element(by.id('HeaderText')).tap()
    }
    // Wait for the confirm button to be clickable. If it takes too long this test
    // will be flaky :(
    await sleep(3000)
    // Wait for the confirm button to be clickable. If it takes too long this test
    // will be flaky :(
    await element(by.id('ConfirmButton')).tap()
    await sleep(3000)
    // Confirm and input PIN if necessary.
    await enterPinUiIfNecessary()
    // Wait 10 seconds checking that error banner is not visible each second
    await waitForExpectNotVisible('errorBanner')
    // Return to home.
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

  jest.retryTimes(2)
  it('Then should be able to send cEUR to address', async () => {
    // // TODO - Conversions make this difficult
    // // Get starting balance
    // let startBalance = await getBalance()
    // console.log(startBalance)
    // Select cEUR
    await element(by.id('HeaderCurrencyPicker')).tap()
    await element(by.id('Option/cEUR')).tap()
    // Enter the amount and review
    await inputNumberKeypad(`${AMOUNT_TO_SEND}`)
    await element(by.id('Review')).tap()
    // Sleep 1 second
    await sleep(1000)
    // Write a comment
    let randomContent = faker.lorem.words()
    await element(by.id('commentInput/send')).replaceText(`${randomContent}\n`)
    await element(by.id('commentInput/send')).tapReturnKey()
    // Workaround keyboard remaining open on Android (tapReturnKey doesn't work there and just adds a new line)
    if (device.getPlatform() === 'android') {
      // so we tap something else in the scrollview to hide the soft keyboard
      await element(by.id('HeaderText')).tap()
    }
    // Wait for the confirm button to be clickable. If it takes too long this test
    // will be flaky :(
    await sleep(3000)
    // Wait for the confirm button to be clickable. If it takes too long this test
    // will be flaky :(
    await element(by.id('ConfirmButton')).tap()
    await sleep(3000)
    // Confirm and input PIN if necessary.
    await enterPinUiIfNecessary()
    // Wait 10 seconds checking that error banner is not visible each second
    await waitForExpectNotVisible('errorBanner')
    // Return to home.
    await expect(element(by.id('SendOrRequestBar'))).toBeVisible()
    // Look for the latest transaction and assert
    await waitFor(element(by.text(`${randomContent}`)))
      .toBeVisible()
      .withTimeout(60 * 1000)
    // // Get account balance - TODO conversions make this difficult
    // let endBalance = await getBalance()
    // console.log(endBalance)
    // // Assert balance is updated on chain
    // jestExpect(endBalance['cEUR']).toBeCloseTo(startBalance['cEUR'] - AMOUNT_TO_SEND, 3)
  })
}
